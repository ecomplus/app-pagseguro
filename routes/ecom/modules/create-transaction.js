'use strict'
const logger = require('console-files')
const database = require('../../../lib/database')
const newTransaction = require('../../../lib/pagseguro/new-transaction')
const pgClient = require('./../../../lib/pagseguro/client')
const pgInstallments = require('./../../../lib/pagseguro/fetch-installments')
const jstoXML = require('../../../lib/pagseguro/js-to-xml')
const xmlToJSON = require('xml2json')

module.exports = () => {
  return (req, res) => {
    const { params } = req.body
    const storeId = req.storeId
    logger.log(`Transaction #${storeId} ${params.order_number}`)

    const doPayment = async (pgAuth) => {
      const authorizationCode = pgAuth.authorization_code
      const transaction = newTransaction(params)
      let payment
      let installmentsValue
      // choice payment method
      switch (params.payment_method.code) {
        // mount data for payment with credit card
        case 'credit_card':
          const address = params.to || params.billing_address
          const hashs = params.credit_card.hash.split(' // ')
          const installmentsNumber = params.installments_number
          const amountTotal = parseInt(params.amount.total * 1000, 10) / 1000

          if (installmentsNumber > 1) {
            let installmentOptions

            try {
              installmentOptions = await pgClient({
                url: '/v2/sessions',
                authorizationCode,
                method: 'post'
              }, true)
                .then(resp => {
                  const { session } = resp
                  return pgInstallments(session.id, params.amount.total).then(({ data }) => data)
                })
            } catch (e) {
              // ignore
            }

            let installment
            if (installmentOptions) {
              installment = installmentOptions.installments.visa
                .find(option => option.quantity === installmentsNumber)
            }
            if (!installment) {
              if (hashs[2]) {
                try {
                  installment = JSON.parse(hashs[2])
                    .find(option => option.quantity === installmentsNumber)
                } catch (e) {
                  // ignore invalid json
                  installment = null
                }
              }
            }
            if (installment && installment.totalAmount) {
              installmentsValue = {
                total: installment.totalAmount,
                value: installment.installmentAmount,
                tax: (!installment.interestFree)
              }
            }
          }

          if (!installmentsValue || !installmentsValue.value) {
            // default installments interest free
            installmentsValue = {
              total: amountTotal,
              value: amountTotal / installmentsNumber,
              tax: false
            }
          }

          payment = {
            ...transaction,
            mode: 'default',
            method: 'creditCard',
            creditCard: {
              token: hashs[1],
              installment: {
                quantity: params.installments_number,
                value: parseFloat(
                  (installmentsValue && installmentsValue.value) ||
                  amountTotal
                ).toFixed(2)
              },
              holder: {
                name: params.credit_card.holder_name,
                documents: {
                  document: {
                    type: params.buyer.registry_type === 'p' ? 'CPF' : 'CNPJ',
                    value: params.buyer.doc_number
                  }
                },
                birthDate: convertDate(
                  params.buyer.birth_date.day,
                  params.buyer.birth_date.month,
                  params.buyer.birth_date.year
                ),
                phone: {
                  areaCode: params.buyer.phone.number.substr(0, 2),
                  number: params.buyer.phone.number.substr(2, params.buyer.phone.number)
                }
              },
              billingAddress: {
                street: trimString(address.street),
                number: address.number || 'SN',
                district: address.borough || '',
                city: address.city,
                state: address.province_code,
                country: 'BRA',
                postalCode: address.zip
              }
            }
          }

          if (payment.sender && hashs[0]) {
            payment.sender.hash = hashs[0]
          }

          break
        case 'banking_billet':
          payment = {
            mode: 'default',
            method: 'boleto',
            ...transaction
          }
          break
        case 'online_debit':
          payment = {
            mode: 'default',
            method: 'eft',
            bank: {
              name: 'itau'
            },
            ...transaction
          }
          break
        default: break
      }

      let xml = '<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>'
      xml += jstoXML({ payment })

      return pgClient({
        url: '/v2/transactions',
        method: 'post',
        data: xml,
        authorizationCode
      }, true)
        .then(data => {
          database.saveTransaction(data.transaction.code, data.transaction.status, storeId)

          let response
          switch (params.payment_method.code) {
            case 'credit_card':
              response = {
                'redirect_to_payment': false,
                'transaction': {
                  'amount': Number(data.transaction.grossAmount),
                  'creditor_fees': {
                    'installment': Number(data.transaction.installmentCount),
                    'intermediation': Number(data.transaction.feeAmount)
                  },
                  'currency_id': 'BRL',
                  'installments': {
                    'number': Number(data.transaction.installmentCount),
                    'tax': installmentsValue.tax,
                    'total': installmentsValue.total,
                    'value': installmentsValue.value
                  },
                  'intermediator': {
                    'payment_method': {
                      'code': 'credit_card',
                      'name': 'Cartão de Crédito'
                    },
                    'transaction_id': data.transaction.code,
                    'transaction_code': data.transaction.code,
                    'transaction_reference': data.transaction.reference
                  },
                  'status': {
                    'current': paymentStatus(data.transaction.status)
                  }
                }
              }
              break
            case 'banking_billet':
              response = {
                'redirect_to_payment': false,
                'transaction': {
                  'amount': Number(data.transaction.grossAmount),
                  'payment_link': data.transaction.paymentLink
                }
              }
              break
            case 'online_debit':
              response = {
                'redirect_to_payment': false,
                'transaction': {
                  'amount': Number(data.transaction.grossAmount),
                  'banking_billet': {
                    'link': data.transaction.paymentLink,
                  },
                  'creditor_fees': {
                    'installment': parseInt(data.transaction.installmentCount),
                    'intermediation': Number(data.transaction.grossAmount)
                  },
                  'currency_id': 'BRL',
                  'installments': {
                    'number': parseInt(data.transaction.installmentCount)
                  },
                  'intermediator': {
                    'payment_method': {
                      'code': 'banking_billet',
                      'name': 'Boleto'
                    },
                    'transaction_id': data.transaction.code,
                    'transaction_code': data.transaction.code,
                    'transaction_reference': data.transaction.reference
                  },
                  'payment_link': data.transaction.paymentLink,
                  'status': {
                    'current': paymentStatus(data.transaction.status)
                  }
                }
              }
              break
            default: break
          }

          return res.send(response)
        })
    }

    database
      .getPagSeguroAuth(storeId)
      .then(pgAuth => {
        return doPayment(pgAuth)
      })
      .catch(err => {
        let message = err.message
        if (err.name === 'AuthNotFound') {
          return res.status(400).send({
            error: 'CREATE_TRANSACTION_PS_ERR',
            message: 'Authentication not found, please install the application again.'
          })
        } else {
          const { status, headers } = err.response
          logger.log(`PagSeguro ${status} response for #${storeId} ${params.order_number}`)
          // treat some PagSeguro response status
          if (status === 403 || status >= 500) {
            res.status(status || 403).send({
              error: 'CREATE_TRANSACTION_PS_ERR',
              message: 'PagSeguro seems to be offline, try again later'
            })
          } else if (status === 401) {
            res.status(401).send({
              error: 'TRANSACTION_PS_AUTH_ERR',
              message: 'PagSeguro authentication error, please try another playment method'
            })
          } else if (status === 400) {
            if (headers['content-type'] === 'application/xml;charset=ISO-8859-1' &&
              (err.response && err.response.data) &&
              typeof err.response.data === 'string') {
              const error = JSON.parse(xmlToJSON.toJson(err.response.data))

              const { errors } = error
              if (errors && errors.error) {
                if (Array.isArray(errors.error)) {
                  message = ''
                  errors.error.forEach(e => {
                    message += `${e.message} | `
                  })
                } else {
                  message = errors.error.message
                }
              }

              err.pagseguroErrorJSON = error
              res.status(400).send({
                error: 'CREATE_TRANSACTION_ERR',
                message,
                errors
              })
            }
          }

          // debug axios request error stack
          err.storeId = storeId
          err.orderNumber = params.order_number
          // return logger.error(err)
        }
      })
  }
}

const convertDate = (day, month, year) => {
  if (day < 10) {
    day = '0' + day
  }
  if (month < 10) {
    month = '0' + month
  }
  return `${day}/${month}/${year}`
}

const trimString = (string) => {
  if (typeof string === 'string') {
    string = string.toLowerCase()
    string = string.replace(new RegExp('[ÁÀÂÃ]', 'gi'), 'a')
    string = string.replace(new RegExp('[ÉÈÊ]', 'gi'), 'e')
    string = string.replace(new RegExp('[ÍÌÎ]', 'gi'), 'i')
    string = string.replace(new RegExp('[ÓÒÔÕ]', 'gi'), 'o')
    string = string.replace(new RegExp('[ÚÙÛ]', 'gi'), 'u')
    string = string.replace(new RegExp('[Ç]', 'gi'), 'c')
    return string
  } else {
    return ''
  }
}

const paymentStatus = code => {
  switch (Number(code)) {
    case 1: return 'pending'
    case 2: return 'under_analysis'
    case 3: return 'paid'
    case 4: return 'paid'
    case 5: return 'in_dispute'
    case 6: return 'refunded'
    case 7: return 'voided'
    default: return 'unknown'
  }
}

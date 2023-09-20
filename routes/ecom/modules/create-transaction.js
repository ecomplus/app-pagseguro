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
      const isPaymentLink = params.payment_method && params.payment_method.code === 'balance_on_intermediary'
      let payment
      let installmentsValue
      let transactionLink
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
                street: trimString(address.street).substr(0, 80),
                number: address.number || 'SN',
                district: (address.borough || '').substr(0, 60),
                city: address.city ? address.city.substr(0, 60) : undefined,
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
        
        case 'balance_on_intermediary':
          transactionLink = {
            intermediator: {
              payment_method: params.payment_method
            },
            currency_id: params.currency_id,
            currency_symbol: params.currency_symbol,
            amount: params.amount.total,
            status: {
              current: 'pending'
            }
          }
          payment = {
            ...transaction,
            redirectURL: `https://${params.domain}/app/#/order/${params.order_number}/${params.order_id}`
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
        url: isPaymentLink ? '/v2/checkout' : '/v2/transactions',
        method: 'post',
        data: xml,
        authorizationCode
      }, true).then((result) => {
        const { transaction } = result
        database.saveTransaction(transaction.code, transaction.status, storeId)

        let response
        switch (params.payment_method.code) {
          case 'credit_card':
            response = {
              'redirect_to_payment': false,
              'transaction': {
                'amount': Number(transaction.grossAmount),
                'creditor_fees': {
                  'installment': Number(transaction.installmentCount),
                  'intermediation': Number(transaction.feeAmount)
                },
                'currency_id': 'BRL',
                'installments': {
                  'number': Number(transaction.installmentCount),
                  'tax': installmentsValue.tax,
                  'total': installmentsValue.total,
                  'value': installmentsValue.value
                },
                'intermediator': {
                  'payment_method': {
                    'code': 'credit_card',
                    'name': 'Cartão de Crédito'
                  },
                  'transaction_id': transaction.code,
                  'transaction_code': transaction.code,
                  'transaction_reference': String(transaction.reference)
                },
                'status': {
                  'current': paymentStatus(transaction.status)
                }
              }
            }
            break
          case 'online_debit':
            response = {
              'redirect_to_payment': false,
              'transaction': {
                'amount': Number(transaction.grossAmount),
                'payment_link': transaction.paymentLink,
                'currency_id': 'BRL',
                'intermediator': {
                  'payment_method': {
                    'code': 'online_debit',
                    'name': 'Débito Online'
                  },
                  'transaction_id': transaction.code,
                  'transaction_code': transaction.code,
                  'transaction_reference': String(transaction.reference)
                },
                'payment_link': transaction.paymentLink,
                'status': {
                  'current': paymentStatus(transaction.status)
                }
              }
            }
            break

          case 'banking_billet':
            response = {
              'redirect_to_payment': false,
              'transaction': {
                'amount': Number(transaction.grossAmount),
                'banking_billet': {
                  'link': transaction.paymentLink,
                },
                'creditor_fees': {
                  'installment': parseInt(transaction.installmentCount),
                  'intermediation': Number(transaction.grossAmount)
                },
                'currency_id': 'BRL',
                'installments': {
                  'number': parseInt(transaction.installmentCount)
                },
                'intermediator': {
                  'payment_method': {
                    'code': 'banking_billet',
                    'name': 'Boleto'
                  },
                  'transaction_id': transaction.code,
                  'transaction_code': transaction.code,
                  'transaction_reference': String(transaction.reference)
                },
                'payment_link': transaction.paymentLink,
                'status': {
                  'current': paymentStatus(transaction.status)
                }
              }
            }
            break
          default: break
        }

        if (isPaymentLink && transactionLink) {
          transactionLink.payment_link = `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${result.checkout && result.checkout.code}`
          res.send({
            redirect_to_payment: true,
            transaction: transactionLink
          })
        }

        return res.send(response)
      })
    }

    database.getPagSeguroAuth(storeId).then(doPayment).catch(err => {
      let message = err.message
      let errorResponse = {}
      if (typeof err.toJSON === 'function') {
        errorResponse = err.toJSON()
      }
      errorResponse.store_id = storeId
      errorResponse.order_number = params.order_number

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

            errorResponse.message = message
            errorResponse.data = error
          }

          res.status(400).send({
            error: 'CREATE_TRANSACTION_ERR',
            message
          })
        }

        logger.error(JSON.stringify(errorResponse, undefined, 2))
        return false
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

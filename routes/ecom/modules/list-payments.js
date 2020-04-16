'use strict'
const { getPagSeguroAuth } = require('./../../../lib/database')
const PagSeguro = require('./../../../lib/pagseguro/pagseguro-client')
const logger = require('console-files')

module.exports = appSdk => {
  return (req, res) => getPagSeguroAuth(req.storeId)
    .then(auth => {
      // pagseguro client
      const pg = new PagSeguro({
        appId: process.env.PS_APP_ID,
        appKey: process.env.PS_APP_KEY,
        authorizationCode: auth.authorization_code
      })

      // parse params from body
      const { params, application } = req.body

      const sendPaymentGateways = ({ session, installmentOptions }) => {
        // app settings
        const config = Object.assign(application.data, application.hidden_data)

        // empty response
        const response = {
          payment_gateways: []
        }

        // calculate discount value
        const { discount } = config
        if (discount && discount.value > 0) {
          if (discount.apply_at !== 'freight') {
            // default discount option
            const { value } = discount
            response.discount_option = {
              label: config.discount_option_label,
              value
            }
            // specify the discount type and min amount is optional
            ;['type', 'min_amount'].forEach(prop => {
              if (discount[prop]) {
                response.discount_option[prop] = discount[prop]
              }
            })
          }
        }


        const sandbox = (process.env.PS_APP_SANDBOX && process.env.PS_APP_SANDBOX === 'true') ? '-sandbox' : ''
        let onloadFunction = `window.pagseguroSessionId="${session}";`
        if (installmentOptions && installmentOptions.installments) {
          const installmentsJson = JSON.stringify(installmentOptions.installments.visa)
          if (installmentsJson.length > 50 && installmentsJson.length <= 1500) {
            onloadFunction += `window.pagseguroInstallments=${installmentsJson};`
          }
        }

        // credit_card
        if (!config.credit_card || !config.credit_card.disabled) {
          const creditCard = {
            ...newPaymentGateway(),
            payment_method: {
              code: 'credit_card',
              name: 'Cartão de crédito - pagseguro'
            },
            label: 'Cartão de crédito',
            installment_options: [],
            js_client: {
              cc_brand: {
                function: 'pagseguroBrand',
                is_promise: true
              },
              cc_hash: {
                function: 'pagseguroHash',
                is_promise: true
              },
              fallback_script_uri: `https://pagseguro.ecomplus.biz/fallback-pagseguro-dp${sandbox}.js`,
              onload_expression: onloadFunction,
              script_uri: `https://pagseguro.ecomplus.biz/pagseguro-dp${sandbox}.js`
            },
            icon: 'https://e-com.club/mass/ftp/others/pagseguro_credito.png',
            card_companies: config.card_companies
          }

          if (installmentOptions && installmentOptions.installments && installmentOptions.installments.visa) {
            const { visa } = installmentOptions.installments

            creditCard.installment_options = visa
              .filter(installment => installment.quantity > 1)
              .map(installment => {
                return {
                  number: installment.quantity,
                  tax: (!installment.interestFree),
                  value: Math.abs(installment.installmentAmount)
                }
              })

            //response.installments_option
            const installmentsOption = visa.find(option => option.interestFree === false)
            response.installments_option = {
              min_installment: installmentsOption.quantity,
              max_number: visa.length,
              monthly_interest: 0
            }
          }

          response.payment_gateways.push(creditCard)
        }

        // check if payment options are enabled before adding payment list
        // baking_billet
        if (!config.banking_billet || !config.banking_billet.disabled) {
          const bankingBillet = {
            ...newPaymentGateway(),
            payment_method: {
              code: 'banking_billet',
              name: 'Boleto Bancário'
            },
            label: 'Boleto Bancário',
            expiration_date: (config && config.banking_billet) ? config.banking_billet.expiration_date : undefined,
            instruction_lines: {
              first: 'Atenção',
              second: 'fique atento à data de vencimento do boleto.',
              third: 'Pague em qualquer casa lotérica.'
            },
            js_client: {
              transaction_promise: '_senderHash',
              fallback_script_uri: `https://pagseguro.ecomplus.biz/fallback-pagseguro-dp${sandbox}.js`,
              onload_expression: onloadFunction,
              script_uri: `https://pagseguro.ecomplus.biz/pagseguro-dp${sandbox}.js`
            },
            discount
          }

          response.payment_gateways.push(bankingBillet)
        }

        // online_debit
        if (!config.online_debit || !config.online_debit.disabled) {
          const onlineDebit = {
            ...newPaymentGateway(),
            payment_method: {
              code: 'online_debit',
              name: 'Débito Online'
            },
            label: 'Débito Online',
            icon: 'https://e-com.club/mass/ftp/others/pagseguro_debito.png',
            js_client: {
              transaction_promise: '_senderHash',
              fallback_script_uri: `https://pagseguro.ecomplus.biz/fallback-pagseguro-dp${sandbox}.js`,
              onload_expression: onloadFunction,
              script_uri: `https://pagseguro.ecomplus.biz/pagseguro-dp${sandbox}.js`
            }
          }

          response.payment_gateways.push(onlineDebit)
        } else {
          // remove discount options from response
          delete response.discount_option
        }

        // const sortFunc = (a, b) => sort.indexOf(a.payment_method.code) - sort.indexOf(b.payment_method.code)
        // response.payment_gateways.sort(sortFunc)
        // response
        return res.send(response)
      }

      if (params.is_checkout_confirmation) {
        logger.log(`Checkout #${req.storeId}`)
        sendPaymentGateways({})
      } else {
        // card session
        pg.session.new()
          .then(async session => {
            let installmentOptions
            if (params.amount && params.amount.total) {
              try {
                installmentOptions = await pg.installments.getInstallments(session, params.amount.total)
              } catch (e) {
                // ignore
              }
            }
            sendPaymentGateways({ session, installmentOptions })
          })
          .catch(err => {
            logger.error(err)
            res.status(400).send({
              error: 'LIST_PAYMENTS_ERR',
              message: 'Unexpected error, try again later'
            })
          })
      }
    })

    .catch(e => {
      console.log(e)
      res.status(400).send({
        error: 'LIST_PAYMENTS_ERR',
        message: 'No authentication for current store'
      })
    })
}

const newPaymentGateway = () => {
  return {
    intermediator: {
      code: 'pagseguro',
      link: 'https://www.pagseguro.com.br',
      name: 'Pagseguro'
    },
    payment_url: 'https://www.pagseguro.com.br/',
    type: 'payment'
  }
}
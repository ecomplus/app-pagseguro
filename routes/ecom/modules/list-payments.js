'use strict'
const { getPagSeguroAuth } = require('./../../../lib/database')
const PagSeguro = require('./../../../lib/pagseguro/pagseguro-client')

module.exports = (appSdk) => {
  return (req, res) => {
    getPagSeguroAuth(req.storeId)
      .then(auth => {
        // pagseguro client
        const pg = new PagSeguro({
          appId: process.env.PS_APP_ID,
          appKey: process.env.PS_APP_KEY,
          authorizationCode: auth.authorization_code
        })
        // card session
        pg.session.new()
          .then(session => {
            // parse params from body
            const { params, application } = req.body

            // load application default config
            let { payment_options, sort } = require('./../../../lib/payment-default')

            // array to merge config
            let configMerged = []

            // empty payload
            let payload = {
              payment_gateways: []
            }

            // merge application default config with
            // configuration sent at application.hidden_data
            payment_options.forEach(defaultOption => {
              // if the application not has payments config setted up, uses default.
              if (!application.hasOwnProperty('hidden_data') || !application.hidden_data.hasOwnProperty('payment_options')) {
                configMerged.push(defaultOption)
              } else {
                // Checks if default payment option is set in application.hidden_data
                const applicationConfiguration = application.hidden_data.payment_options.find(applicationOption => applicationOption.type === defaultOption.type)

                if (applicationConfiguration) {
                  // check if payment options is enabled to list at list_payments
                  if (applicationConfiguration.enabled === true) {
                    configMerged.push({
                      ...defaultOption,
                      ...applicationConfiguration
                    })
                  }
                } else {
                  // uses payment_option default if option is not setted up at application.hidden_data.payment_options
                  configMerged.push(defaultOption)
                }
              }
            })

            // create payment option list for list_payment
            // with merged configuration
            configMerged.forEach(config => {
              let paymentGateways = {}
              paymentGateways.discount = listPaymentOptions.discount(config)
              paymentGateways.icon = listPaymentOptions.icon(config)
              paymentGateways.installments = listPaymentOptions.intermediator(config)
              paymentGateways.installment_options = listPaymentOptions.installment_options(config, params)
              paymentGateways.label = listPaymentOptions.label(config)
              paymentGateways.payment_method = listPaymentOptions.payment_method(config)
              paymentGateways.payment_url = listPaymentOptions.payment_url(config)
              paymentGateways.type = listPaymentOptions.type(config)
              if ((config.type === 'credit_card')) {
                paymentGateways.js_client = listPaymentOptions.js_client(config, session)
              }

              payload.payment_gateways.push(paymentGateways)
            })

            // interest_free_installments
            configMerged.forEach(config => {
              if (config.hasOwnProperty('installments')) {
                // sort array
                config.installments.sort((a, b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0))

                config.installments.filter(installment => {
                  if (installment.tax === false && installment.number > 1) {
                    payload.interest_free_installments = installment.number
                  }
                })
              }
            })

            // discount_options
            configMerged.forEach(config => {
              if (config.type === 'banking_billet' && config.hasOwnProperty('discount')) {
                if (config.discount.value > 0) {
                  payload.discount_options = {
                    label: config.name,
                    type: config.discount.type,
                    value: config.discount.value
                  }
                }
              }
            })

            // sort config
            if (application.hasOwnProperty('hidden_data') && application.hidden_data.hasOwnProperty('sort')) {
              sort = [...application.hidden_data.sort, ...sort]
            }

            const sortFunc = (a, b) => sort.indexOf(a.payment_method.code) - sort.indexOf(b.payment_method.code)
            payload.payment_gateways.sort(sortFunc)

            // response
            return res.send(payload)
          })
      })
  }
}

const listPaymentOptions = {
  discount: (config) => {
    if (config.hasOwnProperty('discount')) {
      return {
        type: config.discount.type,
        value: config.discount.value
      }
    }
  },
  icon: (config) => {
    if (config.hasOwnProperty('icon')) {
      return config.icon
    }
  },
  installment_options: (config, params) => {
    if (config.hasOwnProperty('installments')) {
      let installments = config.installments
        .filter(installment => installment.number > 1)
        .map(installment => {
          let installmentValue = params.amount.total / installment.number
          let taxValue = installment.tax_value / 100
          let installmentFinalValue = installment.tax ? (installmentValue * taxValue + installmentValue) : installmentValue

          return {
            number: installment.number,
            tax: installment.tax,
            value: Math.abs(installmentFinalValue)
          }
        })

      return installments
    }
  },
  intermediator: (config) => {
    if (config.hasOwnProperty('intermediator')) {
      return {
        code: config.intermediator.code,
        link: config.intermediator.link,
        name: config.intermediator.name
      }
    }
  },
  js_client: (config, sessionId) => {
    if (config.type === 'credit_card') {
      let sandbox = (process.env.PS_APP_SANDBOX && process.env.PS_APP_SANDBOX === 'true') ? 'sandbox.' : ''
      let onloadFunction = `window.pagseguroHash=function(card){PagSeguroDirectPayment.setSessionId("${sessionId}")
      return new Promise(function(resolve,reject){var checkResponse=function(response){console.log(response)
      if(response.status==='error'){reject(new Error(response.message))
      return!1}
      return!0}
      PagSeguroDirectPayment.onSenderHashReady(function(response){if(checkResponse(response)){var hash=response.senderHash
      console.log('PagSeguroDirectPayment->hash: '+hash)
      PagSeguroDirectPayment.getBrand({cardBin:parseInt(card.number.replace(/\D/g,'').substr(0,6),10),complete:function(response){if(checkResponse(response)){var brand=response.brand.name
      console.log('PagSeguroDirectPayment->brand: '+brand)
      PagSeguroDirectPayment.createCardToken({cardNumber:card.number.replace(/\D/g,''),brand:brand,cvv:card.cvc,expirationMonth:card.month,expirationYear:card.year.length>2?card.year:'20'+card.year,complete:function(response){if(checkResponse(response)){var token=hash+' // '+response.card.token
      resolve(token)}}})}}})}})})}`
      return {
        cc_brand: {
          function: 'pagseguroBrand',
          is_promise: true
        },
        cc_hash: {
          function: 'pagseguroHash',
          is_promise: true
        },
        fallback_script_uri: `https://stc.${sandbox}pagseguro.uol.com.br/pagseguro/api/v2/checkout/pagseguro.directpayment.js`,
        onload_expression: onloadFunction,
        script_uri: `https://stc.${sandbox}pagseguro.uol.com.br/pagseguro/api/v2/checkout/pagseguro.directpayment.js`
      }
    }
  },
  label: (config) => {
    if (config.hasOwnProperty('name')) {
      return config.name
    }
  },
  payment_method: (config) => {
    if (config.hasOwnProperty('type')) {
      return {
        code: config.type,
        name: config.name
      }
    }
  },
  payment_url: (config) => {
    if (config.hasOwnProperty('url')) {
      return config.url
    }
  },
  type: (config) => {
    return config.payment_type || 'payment'
  }
}

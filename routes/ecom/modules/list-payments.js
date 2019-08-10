'use strict'
const { getPagSeguroAuth } = require('./../../../lib/database')
const PagSeguro = require('./../../../lib/pagseguro/pagseguro-client')
const logger = require('console-files')

module.exports = (appSdk) => {
  return (req, res) => {
    logger.log(JSON.stringify(req.body))
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

          .then(async session => {

            // parse params from body
            const { params, application } = req.body

            const installmentOptions = await pg.installments.getInstallments(session, params.amount.total)
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
            configMerged.forEach(async config => {
              let paymentGateways = {}
              paymentGateways.discount = listPaymentOptions.discount(config)
              paymentGateways.icon = listPaymentOptions.icon(config)
              paymentGateways.installments = listPaymentOptions.intermediator(config)
              paymentGateways.label = listPaymentOptions.label(config)
              paymentGateways.payment_method = listPaymentOptions.payment_method(config)
              paymentGateways.payment_url = listPaymentOptions.payment_url(config)
              paymentGateways.type = listPaymentOptions.type(config)
              if ((config.type === 'credit_card')) {
                paymentGateways.js_client = listPaymentOptions.js_client(config, session)
                paymentGateways.installment_options = listPaymentOptions.installment_options(installmentOptions)
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
            logger.log(payload)
            // response
            return res.send(payload)
          })
          .catch(error => {
            logger.error('LIST_PAYMENTS_ERR', error)
            res.status(400)
            return res.send({
              error: 'LIST_PAYMENTS_ERR',
              message: 'Unexpected Error Try Later'
            })
          })
      })

      .catch(error => {
        logger.error('LIST_PAYMENTS_ERR', error)
        res.status(400)
        return res.send({
          error: 'LIST_PAYMENTS_ERR',
          message: 'Unexpected Error Try Later'
        })
      })
  }
}

const listPaymentOptions = {
  discount: (config) => {
    if (config.hasOwnProperty('discount') && config.discount.value > 0) {
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
  installment_options: (options) => {
    let installments = []
    installments = options
      .installments
      .visa
      .filter(installment => installment.quantity > 1)
      .map(installment => {
        return {
          number: installment.quantity,
          tax: (!installment.interestFree),
          value: Math.abs(installment.installmentAmount)
        }
      })
    return installments
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
  js_client: (config, session) => {
    if (config.type === 'credit_card') {
      const sandbox = (process.env.PS_APP_SANDBOX && process.env.PS_APP_SANDBOX === 'true') ? '-sandbox' : ''
      const onloadFunction = `window.pagseguroSessionId="${session}";`
      return {
        cc_brand: {
          function: 'pagseguroBrand',
          is_promise: true
        },
        cc_hash: {
          function: 'pagseguroHash',
          is_promise: true
        },
        fallback_script_uri: `https://pagseguro.ecomplus.biz/pagseguro-dp${sandbox}.js`,
        onload_expression: onloadFunction,
        script_uri: `https://pagseguro.ecomplus.biz/pagseguro-dp${sandbox}.js`
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

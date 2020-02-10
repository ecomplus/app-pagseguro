'use strict'
const { getPagSeguroAuth } = require('./../../../lib/database')
const PagSeguro = require('./../../../lib/pagseguro/pagseguro-client')
const logger = require('console-files')

module.exports = (appSdk) => {
  return (req, res) => {
    let retry = 0
    const request = () => getPagSeguroAuth(req.storeId)

      .then(auth => {
        // pagseguro client
        const pg = new PagSeguro({
          appId: process.env.PS_APP_ID,
          appKey: process.env.PS_APP_KEY,
          authorizationCode: auth.authorization_code
        })

        // card session
        return pg.session.new()

          .then(async session => {
            // parse params from body
            const { params, application } = req.body
            // app settings
            const getConfig = Object.assign({}, application.hidden_data)
            // load application default config
            let { payment_options, sort } = require('./../../../lib/payment-default')

            // array to merge config
            const configMerged = []

            // empty payload
            const payload = {
              payment_gateways: []
            }

            // merge application default config with
            // configuration sent at application.hidden_data
            payment_options.forEach(defaultOption => {
              // if the application not has payments config setted up, uses default.
              if (!getConfig || !getConfig.payment_options) {
                configMerged.push(defaultOption)
              } else {
                // Checks if default payment option is set in application.hidden_data
                const applicationConfiguration = getConfig.payment_options.find(applicationOption => applicationOption.type === defaultOption.type)

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

            const { items, amount } = params

            if (items && amount) {
              const installmentOptions = await pg.installments.getInstallments(session, amount.total)
              // create payment option list for list_payment
              // with merged configuration
              configMerged.forEach(async config => {
                const paymentGateways = {}
                paymentGateways.discount = listPaymentOptions.discount(config)
                paymentGateways.icon = listPaymentOptions.icon(config)
                paymentGateways.intermediator = listPaymentOptions.intermediator(config)
                paymentGateways.label = listPaymentOptions.label(config)
                paymentGateways.payment_method = listPaymentOptions.payment_method(config)
                paymentGateways.payment_url = listPaymentOptions.payment_url(config)
                paymentGateways.type = listPaymentOptions.type(config)
                paymentGateways.js_client = listPaymentOptions.js_client(config, session)
                if ((config.type === 'credit_card')) {
                  paymentGateways.installment_options = listPaymentOptions.installment_options(installmentOptions)
                  paymentGateways.card_companies = config.card_companies
                }
                payload.payment_gateways.push(paymentGateways)
              })
            }

            // discount_option
            if (getConfig && getConfig.discount_option) {
              const discountOption = getConfig.discount_option || {}
              payload.discount_option = {
                min_amount: discountOption.min_amount,
                label: discountOption.label,
                type: discountOption.type,
                value: discountOption.value
              }
            }

            // installments_option
            if (getConfig && getConfig.installments_option) {
              const installmentOptions = getConfig.installments_option || {}
              payload.installments_option = {
                min_installment: installmentOptions.min_installment,
                max_number: installmentOptions.max_number,
                monthly_interest: installmentOptions.monthly_interest
              }
            }

            // sort config
            if (getConfig && getConfig.sort) {
              sort = [...getConfig.sort, ...sort]
            }

            const sortFunc = (a, b) => sort.indexOf(a.payment_method.code) - sort.indexOf(b.payment_method.code)
            payload.payment_gateways.sort(sortFunc)
            // response
            return res.send(payload)
          })
      })

      .catch(error => {
        let message
        // axios
        if (error && error.response) {
          message = error.response.data
        } else {
          // throw
          message = error.message
        }

        if (message.indexOf('ECONNRESET') === -1 && message.indexOf('ENOTFOUND') === -1) {
          logger.error(`Listpayment Error | Store #${req.storeId} | Error ${message}`)
          res.status(400).send({
            error: 'LIST_PAYMENTS_ERR',
            message: 'Unexpected Error Try Later'
          })
        } else if (retry <= 4) {
          setTimeout(() => {
            request()
          }, retry * 1000)
          retry++
        } else {
          res.status(400).send({
            error: 'LIST_PAYMENTS_ERR',
            message: 'Unexpected Error Try Later'
          })
        }
      })
    request()
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
    const sandbox = (process.env.PS_APP_SANDBOX && process.env.PS_APP_SANDBOX === 'true') ? '-sandbox' : ''
    const onloadFunction = `window.pagseguroSessionId="${session}";`
    const js = {
      fallback_script_uri: `https://pagseguro.ecomplus.biz/fallback-pagseguro-dp${sandbox}.js`,
      onload_expression: onloadFunction,
      script_uri: `https://pagseguro.ecomplus.biz/pagseguro-dp${sandbox}.js`
    }

    if (config.type === 'credit_card') {
      js.cc_brand = {
        function: 'pagseguroBrand',
        is_promise: true
      }
      js.cc_hash = {
        function: 'pagseguroHash',
        is_promise: true
      }
    } else {
      js.transaction_promise = '_senderHash'
    }
    return js
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

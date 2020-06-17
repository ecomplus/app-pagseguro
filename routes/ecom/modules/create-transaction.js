'use strict'

const logger = require('console-files')
const PagSeguro = require('./../../../lib/pagseguro/pagseguro-client')
const { getPagSeguroAuth, saveTransaction } = require('./../../../lib/database')

module.exports = () => {
  return (req, res) => {
    const { params } = req.body
    const storeId = req.storeId
    logger.log(`Transaction #${storeId} ${params.order_number}`)

    getPagSeguroAuth(storeId)
      .then(async auth => {
        // pagseguro client
        const ps = new PagSeguro({
          appId: process.env.PS_APP_ID,
          appKey: process.env.PS_APP_KEY,
          authorizationCode: auth.authorization_code
        })

        // create transaction
        ps.trasaction.new(params)

        // choice payment method
        switch (params.payment_method.code) {
          case 'credit_card':
            await ps.checkout.card()
            break
          case 'banking_billet':
            ps.checkout.bankingBillet()
            break
          case 'online_debit':
            ps.checkout.onlineDebit()
            break
          default: break
        }

        // process checkout body
        // and pay
        return ps.pay.new().then(({ payload, schema }) => {
          // save transaction code
          saveTransaction(payload.transaction.code, payload.transaction.status, storeId)
          // response
          return res.send(schema)
        })
      })

      .catch(err => {
        if (err.response) {
          const { status } = err.response
          logger.log(`PagSeguro ${status} response for #${storeId} ${params.order_number}`)
          // treat some PagSeguro response status
          if (status >= 500) {
            return res.status(403).send({
              error: 'CREATE_TRANSACTION_PS_ERR',
              message: 'PagSeguro seems to be offline, try again later'
            })
          } else if (status === 401) {
            return res.status(401).send({
              error: 'TRANSACTION_PS_AUTH_ERR',
              message: 'PagSeguro authentication error, please try another playment method'
            })
          }
        }

        // debug axios request error stack
        err.storeId = storeId
        err.orderNumber = params.order_number
        logger.error(err)
        return res.status(409).send({
          error: 'PS_TRANSACTION_INVALID',
          message: err.message || 'Unexpected error, try again later'
        })
      })
  }
}

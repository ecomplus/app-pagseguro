'use strict'
const logger = require('console-files')
const PagSeguro = require('./../../../lib/pagseguro/pagseguro-client')
const { getPagSeguroAuth, saveTransaction } = require('./../../../lib/database')
module.exports = () => {
  return (req, res) => {
    logger.log(JSON.stringify(req.body))
    const { params } = req.body
    const storeId = req.storeId
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

      .catch(() => {
        if (params && params.is_checkout_confirmation === true) {
          logger.error(`Erro trying to create transaction for order ${params.order_number} | Store #${storeId}`)
        }
        return res.status(400).send({
          error: 'CREATE_TRANSACTION_ERR',
          message: 'Unexpected Error Try Later'
        })
      })
  }
}

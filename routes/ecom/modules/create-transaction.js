'use strict'
const logger = require('console-files')
const PagSeguro = require('./../../../lib/pagseguro/pagseguro-client')
const { getPagSeguroAuth, saveTransaction } = require('./../../../lib/database')
module.exports = () => {
  return (req, res) => {
    const { params } = req.body
    const storeId = req.storeId
    logger.log(JSON.stringify(params))
    getPagSeguroAuth(storeId)

      .then(auth => {
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
            ps.checkout.card()
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
        ps.pay.new().then(({ payload, schema }) => {
          // save transaction code
          saveTransaction(payload.transaction.code, payload.transaction.status, storeId)
          // status code
          res.status(201)
          // response
          res.send(schema)
        })

          .catch(error => {
            logger.error('CREATE_TRANSACTION_ERR', error)
            return res.status(500).send({
              error: 'CREATE_TRANSACTION_ERR',
              message: error.response.data
            })
          })
      })

      .catch(error => {
        logger.error('create_transaction error:', error)
        return res.status(400).send({ error: error.message })
      })
  }
}

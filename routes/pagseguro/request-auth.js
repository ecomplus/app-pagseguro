'use strict'
const { toXML } = require('jstoxml')
const pgClient = require('./../../lib/pagseguro/client')

module.exports = () => {
  return (req, res) => {
    const { query } = req
    const storeId = query.x_store_id || query.storeId || query.store_id || req.get('x-store-id')

    if (!storeId) {
      return res.status(400).send('You must to specify the store_id in the url: eg; x_store_id=100 or store_id=100 or storeId=100')
    }

    const { PS_APP_REDIRECT_URI, PS_APP_NOTIFICATION_URL } = process.env

    // callback body
    const reqAuth = {
      authorizationRequest: {
        reference: storeId,
        permissions: {
          code: [
            'CREATE_CHECKOUTS',
            'RECEIVE_TRANSACTION_NOTIFICATIONS',
            'SEARCH_TRANSACTIONS',
            'MANAGE_PAYMENT_PRE_APPROVALS',
            'DIRECT_PAYMENT'
          ]
        },
        redirectURL: PS_APP_REDIRECT_URI,
        notificationURL: PS_APP_NOTIFICATION_URL
      }
    }

    let xml = '<?xml version="1.0" encoding="iso-8859-1" standalone="yes"?>'
    xml += toXML(reqAuth)

    pgClient({
      url: '/v2/authorizations/request',
      method: 'post',
      data: xml
    }, true)
      .then(data => {
        const { code } = data.authorizationRequest
        const env = (process.env.PS_APP_SANDBOX && process.env.PS_APP_SANDBOX === 'true') ? 'sandbox.' : ''
        const redirectTo = `https://${env}pagseguro.uol.com.br/v2/authorization/request.jhtml?code=${code}`
        return res.redirect(redirectTo)
      })
      .catch(e => {
        return res.status(400).send({
          error: 'REQUEST_AUTH_ERR',
          message: 'PagSeguro authentication error, please try again latter',
          e
        })
      })
  }
}

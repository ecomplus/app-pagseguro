'use strict'
const { toXML } = require('jstoxml')
const xmlToJson = require('xml2json')
const axios = require('axios')
/**
 * @description Pagseguro API PATH
 */
const PAGSEGURO_API_PATH = (process.env.PS_APP_SANDBOX && process.env.PS_APP_SANDBOX === 'true') ? 'https://ws.sandbox.pagseguro.uol.com.br' : 'https://ws.pagseguro.uol.com.br'

module.exports = () => {
  return (req, res) => {
    // storeId
    let { x_store_id } = req.query

    if (!x_store_id) {
      return res.status(400).send('storeId not found at query string')
    }
    // callback body
    const reqAuth = {
      authorizationRequest: {
        reference: x_store_id,
        permissions: {
          code: [
            'CREATE_CHECKOUTS',
            'RECEIVE_TRANSACTION_NOTIFICATIONS',
            'SEARCH_TRANSACTIONS',
            'MANAGE_PAYMENT_PRE_APPROVALS',
            'DIRECT_PAYMENT'
          ]
        },
        redirectURL: process.env.PS_APP_REDIRECT_URI,
        notificationURL: 'https://echo-requests.herokuapp.com/' // process.env.PS_APP_NOTIFICATION_URL
      }
    }
    let xml = '<?xml version="1.0" encoding="iso-8859-1" standalone="yes"?>'
    xml += toXML(reqAuth)
    // request
    const appId = process.env.PS_APP_ID
    const appKey = process.env.PS_APP_KEY
    const resource = `${PAGSEGURO_API_PATH}/v2/authorizations/request/?appId=${appId}&appKey=${appKey}`
    const options = {
      url: resource,
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml; charset=ISO-8859-1'
      },
      data: xml
    }

    axios(options)
      .then(result => {
        return result.data
      })
      .then(data => {
        try {
          let authorizations = JSON.parse(xmlToJson.toJson(data))
          console.log(authorizations)
          let { code } = authorizations.authorizationRequest
          let redirectTo = `https://sandbox.pagseguro.uol.com.br/v2/authorization/request.jhtml?code=${code}`
          return res.redirect(redirectTo)
        } catch (error) {
          throw error
        }
      })
      .catch(e => console.log(e))
  }
}

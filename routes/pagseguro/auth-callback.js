'use strict'
const logger = require('console-files')
const axios = require('axios')
const xmlToJson = require('xml2json')
const { save } = require('./../../lib/database')
/**
 * @description Pagseguro API PATH
 */
const PAGSEGURO_API_PATH = (process.env.PS_APP_SANDBOX && process.env.PS_APP_SANDBOX === 'true') ? 'https://ws.sandbox.pagseguro.uol.com.br' : 'https://ws.pagseguro.uol.com.br'

module.exports = () => {
  return (req, res) => {
    const { notificationCode } = req.query
    const appId = process.env.PS_APP_ID
    const appKey = process.env.PS_APP_KEY
    const resource = `${PAGSEGURO_API_PATH}/v2/authorizations/notifications/${notificationCode}?appId=${appId}&appKey=${appKey}`
    const options = {
      url: resource,
      method: 'GET'
    }

    axios(options)
      .then(result => {
        return result.data
      })
      .then(data => {
        const auth = JSON.parse(xmlToJson.toJson(data))
        save(auth.authorization.code, auth.authorization.authorizerEmail, auth.authorization.reference, auth.authorization.account.publicKey, JSON.stringify(auth.authorization.permissions))
        res.write(`
          <script>
            window.open("", "_self");
            window.close();
          </script>
        `)
        return res.end()
      })
      .catch(e => {
        logger.error('PAGSEGURO_AUTH_CALLBACK_ERR:', e)
        res.status(400)
        res.write(`
          <div>
            <h6>Ocorreu um erro com a authenticação</h6>
            <span>Tente novamente mais tarde</span>
          </div>
        `)
        return res.end()
      })
  }
}

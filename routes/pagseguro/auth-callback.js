'use strict'
const logger = require('console-files')
const { saveAuth, removeAuth } = require('./../../lib/database')
const pgClient = require('./../../lib/pagseguro/client')

module.exports = () => {
  return (req, res) => {
    const { notificationCode } = req.query
    pgClient({
      url: `/v2/authorizations/notifications/${notificationCode}`
    }, true)

      .then(data => {
        res.status(200)
        res.write('Pronto! Já pode fechar a janela')
        res.end()
        const { code, authorizerEmail, reference, account, permissions } = data.authorization
        return removeAuth(reference).then(() => saveAuth(code, authorizerEmail, reference, account.publicKey, JSON.stringify(permissions))).then(() => reference)
      })

      .then(storeId => {
        logger.log('Setup authentication for store #' + storeId)
      })

      .catch(e => {
        logger.error('PAGSEGURO_AUTH_CALLBACK_ERR:', e)
        res.status(500)
        res.write('Ops! Houve um erro enquanto autorizávamos o aplicativo, tente novamente mais tarde ou informe esse erro na community.e-com.plus')
        return res.end()
      })
  }
}

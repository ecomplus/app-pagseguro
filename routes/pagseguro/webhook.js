
'use strict'
const ECHO_SUCCESS = 'SUCCESS'

module.exports = (appSdk) => {
  return (req, res) => {
    const { notificationCode, notificationType } = req.body
    switch (notificationType) {
      case 'applicationAuthorization':
        break
      case 'transaction':
        require('./../../lib/pagseguro/pagseguro-transactions')(appSdk, notificationCode)
        break
      default:
        break
    }
    res.send(ECHO_SUCCESS)
  }
}

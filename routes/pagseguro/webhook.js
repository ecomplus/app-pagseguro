
'use strict'
const SKIP_TRIGGER_NAME = 'SkipTrigger'
const ECHO_SUCCESS = 'SUCCESS'
const ECHO_SKIP = 'SKIP'
const ECHO_API_ERROR = 'STORE_API_ERR'

module.exports = (appSdk) => {
  return (req, res) => {
    const { notificationCode, notificationType } = req.query
    switch (notificationType) {
      case 'applicationAuthorization':
        break
      case 'transaction':
        require('./../../lib/pagseguro/pagseguro-transactions')(appSdk)(notificationCode)
        break
      default:
        break
    }
    res.send(ECHO_SUCCESS)
  }
}

'use strict'
const PagSeguro = require('./../../lib/pagseguro/pagseguro-client')
const { getTransaction } = require('./../../lib/database')
const logger = require('console-files')
const ECHO_SUCCESS = 'SUCCESS'

module.exports = (appSdk) => {
  return (req, res) => {
    const { notificationCode, notificationType } = req.body

    if (notificationType !== 'transaction') {
      return res.send(ECHO_SUCCESS)
    }

    const client = new PagSeguro({
      appId: process.env.PS_APP_ID,
      appKey: process.env.PS_APP_KEY
    })

    let retry = 0
    logger.log(`> Notification: #${notificationCode}`)
    const checkOrderTransaction = (storeId, pgTrasactionCode, pgTrasactionStatus) => {
      const url = `orders.json?transactions.intermediator.transaction_code=${pgTrasactionCode}&fields=_id,number,transactions._id,transactions.intermediator.transaction_code,financial_status`

      const tryAgain = () => {
        const interval = retry * 1000 + 4000
        setTimeout(() => checkOrderTransaction(storeId, pgTrasactionCode, pgTrasactionStatus), interval)
        retry++
      }

      return appSdk.apiRequest(storeId, url)
        .then(resp => resp.response.data)
        .then(data => {
          if (data.result && data.result.length) {
            const order = data.result[0]
            if (order && order.transactions) {
              const orderTransactions = order.transactions.find(trans => trans.intermediator.transaction_code === pgTrasactionCode)
              if (orderTransactions && parseInt(pgTrasactionStatus) !== 4) {
                const resource = `orders/${order._id}/payments_history.json`
                const method = 'POST'
                const body = {
                  transaction_id: orderTransactions._id,
                  date_time: new Date().toISOString(),
                  status: paymentStatus(pgTrasactionStatus),
                  notification_code: notificationCode,
                  flags: ['pagseguro']
                }

                return appSdk.apiRequest(storeId, resource, method, body)
              }
            } else if (retry <= 4) {
              tryAgain()
            }
          } else if (retry <= 4) {
            tryAgain()
          }
        })
    }

    return client
      .notification
      .getNotification(notificationCode)

      .then(pgTransaction => {
        return getTransaction(pgTransaction.code).then(data => ({ localTransaction: data, pgTransaction }))
      })

      .then(({ localTransaction, pgTransaction }) => {
        const storeId = localTransaction.transaction_store_id
        const pgTrasactionCode = pgTransaction.code
        const pgTrasactionStatus = pgTransaction.status
        return checkOrderTransaction(storeId, pgTrasactionCode, pgTrasactionStatus)
      })

      .then(() => res.status(200).end())

      .catch(err => {
        console.error(err)
        if (err.name !== 'NotFound') {
          logger.error('PgNotificationErr', err)
        }
        return res.status(500).send(err)
      })
  }
}

const paymentStatus = code => {
  switch (Number(code)) {
    case 1: return 'pending'
    case 2: return 'under_analysis'
    case 3: return 'paid'
    case 4: return 'paid'
    case 5: return 'in_dispute'
    case 6: return 'refunded'
    case 7: return 'voided'
    default: return 'unknown'
  }
}

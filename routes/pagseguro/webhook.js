'use strict'

const PagSeguro = require('./../../lib/pagseguro/pagseguro-client')
const { getTransaction } = require('./../../lib/database')
const logger = require('console-files')

module.exports = appSdk => {
  return (req, res) => {
    const { notificationCode, notificationType } = req.body
    if (notificationType !== 'transaction') {
      return res.sendStatus(204)
    }
    logger.log(`> Notification: #${notificationCode}`)

    const client = new PagSeguro({
      appId: process.env.PS_APP_ID,
      appKey: process.env.PS_APP_KEY
    })

    const checkOrderTransaction = (storeId, pgTrasactionCode, pgTrasactionStatus, isRetry) => {
      const url = `orders.json?transactions.intermediator.transaction_code=${pgTrasactionCode}` +
        `&fields=_id,transactions._id,transactions.intermediator,transaction.status`

      return appSdk.apiRequest(storeId, url).then(({ response }) => {
        const { data } = response
        if (data.result && data.result.length) {
          const order = data.result[0]
          if (order && order.transactions) {
            const transaction = order.transactions.find(({ intermediator }) => {
              return intermediator && intermediator.transaction_code === pgTrasactionCode
            })
            if (transaction) {
              if (
                Number(pgTrasactionStatus) !== 4 ||
                !transaction.status || transaction.status.current !== 'paid'
              ) {
                const url = `orders/${order._id}/payments_history.json`
                const method = 'POST'
                const body = {
                  transaction_id: transaction._id,
                  date_time: new Date().toISOString(),
                  status: paymentStatus(pgTrasactionStatus),
                  notification_code: notificationCode,
                  flags: ['pagseguro']
                }
                return appSdk.apiRequest(storeId, url, method, body)
              }
              return true
            }
          }
        }

        if (!isRetry) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              checkOrderTransaction(storeId, pgTrasactionCode, pgTrasactionStatus, true)
                .then(resolve).catch(reject)
            }, 5000)
          })
        }

        const err = new Error('Order not found')
        err.name = 'NotFound'
        throw err
      })
    }

    return client
      .notification
      .getNotification(notificationCode)

      .then(pgTransaction => {
        return getTransaction(pgTransaction.code)
          .then(data => ({ localTransaction: data, pgTransaction }))
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

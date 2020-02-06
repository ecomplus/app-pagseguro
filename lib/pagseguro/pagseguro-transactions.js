'use strict'
const PagSeguro = require('./pagseguro-client')
const { getTransaction } = require('./../database')
const logger = require('console-files')

module.exports = (appSdk, notificationCode) => {
  let retry = 0
  const updateTransaction = (notificationCode) => {
    const ps = new PagSeguro({
      appId: process.env.PS_APP_ID,
      appKey: process.env.PS_APP_KEY
    })

    // busca notificação do pagseguro
    return ps.notification.getNotification(notificationCode)

      .then(transaction => {
        // busca notificação no banco de dados
        return getTransaction(transaction.code)
          .then(async result => {
            // busca pedido na E-com Plus
            const resource = `orders.json?transactions.intermediator.transaction_code=${transaction.code}&fields=_id,number,transactions._id,transactions.intermediator.transaction_code,financial_status`
            const method = 'GET'
            const storeId = result.transaction_store_id
            const order = await appSdk.apiRequest(storeId, resource, method).then(resp => resp.response.data.result[0])

            if (order && order.transactions) {
              const orderTransactions = order.transactions.find(trans => trans.intermediator.transaction_code === transaction.code)
              // insere novo entrada no payments_history do pedido
              if (orderTransactions && parseInt(transaction.status) !== 4) {
                const resource = `orders/${order._id}/payments_history.json`
                const method = 'POST'
                const body = {
                  transaction_id: orderTransactions._id,
                  date_time: new Date().toISOString(),
                  status: paymentStatus(transaction.status),
                  notification_code: notificationCode,
                  flags: [
                    'pagseguro'
                  ]
                }

                return appSdk.apiRequest(storeId, resource, method, body)
              }
            } else if (retry <= 4) {
              setTimeout(() => {
                updateTransaction(notificationCode)
              }, retry * 10000 + 4000)
              retry++
            }
          })
      })

      .catch(error => {
        let message
        if (error && error.response) {
          message = error.response.data
        } else {
          message = error.message
        }
        logger.error('PS_NOTIFICATION', message)
      })
  }
  //
  updateTransaction(notificationCode)
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

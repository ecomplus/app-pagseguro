'use strict'
const PagSeguro = require('./pagseguro-client')
const { getTransaction } = require('./../database')
const logger = require('console-files')

module.exports = (appSdk) => {
  return (notificationCode) => {
    try {
      const ps = new PagSeguro({
        appId: process.env.PS_APP_ID,
        appKey: process.env.PS_APP_KEY
      })

      // busca notificação do pagseguro
      ps.notification.getNotification(notificationCode)

        .then(transaction => {
          // busca notificação no banco de dados
          getTransaction(transaction.code)
            .then(result => {
              // busca pedido na E-com Plus
              const resource = `orders.json?transactions.intermediator.transaction_code=${transaction.code}&fields=_id,transactions._id,transactions.intermediator.transaction_code,financial_status`
              const method = 'GET'
              const storeId = result.transaction_store_id
              appSdk.apiRequest(storeId, resource, method)
                .then(order => {
                  order = order.response.data.result[0]
                  if (order) {
                    // verifica se os status são os mesmo nas duas plataformas
                    if (paymentStatus(transaction.status) !== order.financial_status.current) {
                      const orderTransactions = order.transactions.find(trans => trans.intermediator.transaction_code === transaction.code)
                      // insere novo entrada no payments_history do pedido
                      const resource = `orders/${order._id}/payments_history.json`
                      const method = 'POST'
                      const body = {
                        transaction_id: orderTransactions._id,
                        date_time: new Date().toISOString(),
                        status: paymentStatus(transaction.status)
                      }
                      return appSdk.apiRequest(storeId, resource, method, body)
                    }
                  }
                })
            })
        })
    } catch (error) {
      logger.error('PS_NOTIFICATION', error)
    }
  }
}

const paymentStatus = code => {
  switch (Number(code)) {
    case 1: return 'paid'
    case 2: return 'authorized'
    case 3: return 'under_analysis'
    case 4: return 'refunded'
    case 5: return 'voided'
    default: return 'unknown'
  }
}

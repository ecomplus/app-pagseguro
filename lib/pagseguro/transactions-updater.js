'use strict'
// get instances of stores
const xmlToJSON = require('xml2json')
const logger = require('console-files')
const getStores = require('./../get-stores')
const database = require('./../database')
const pgClient = require('./../pagseguro/client')

module.exports = appSdk => {
  logger.log('PagSeguro orders background status updater started')
  const task = () => {
    return new Promise((resolve, reject) => {
      getStores()
        .then(stores => {
          // do stuff
          let i = 0
          const checkStores = stores => {
            const nextStore = () => {
              i++
              checkStores(stores)
            }

            if (!stores[i]) {
              return resolve()
            }

            const storeId = stores[i]

            const checkOrders = (storeId) => {
              database
                .getPagSeguroAuth(storeId)
                .then(pgAuth => {
                  const date = new Date()
                  date.setDate(date.getDate() - 7)
                  const url = 'orders.json?fields=_id,transactions,payments_history,financial_status' +
                    '&transactions.app.intermediator.code=pagseguro' +
                    `&created_at>=${date.toISOString()}` +
                    '&sort=financial_status.updated_at' +
                    '&limit=20'

                  return appSdk
                    .apiRequest(storeId, url)
                    .then(({ response }) => {
                      const { result } = response.data
                      let orderIndex = 0
                      const checkOrdersRecur = (data) => {
                        const nextOrder = () => {
                          orderIndex++
                          checkOrdersRecur(data)
                        }

                        if (!data[orderIndex]) {
                          return nextStore()
                        }

                        const order = data[orderIndex]
                        if (order.financial_status && order.financial_status.current && order.transactions) {
                          const transaction = order.transactions.find(transaction => transaction.intermediator && transaction.intermediator.transaction_code)
                          if (transaction) {
                            pgClient({
                              url: `/v3/transactions/${transaction.intermediator.transaction_code}`
                            }, true)
                              .then(resp => {
                                const pgTransaction = resp.transaction
                                const { current } = order.financial_status
                                if (pgSeguroStatusToEcomplus(Number(pgTransaction.status)) !== current) {
                                  const url = `orders/${order._id}/payments_history.json`
                                  const method = 'POST'
                                  const body = {
                                    transaction_id: transaction._id,
                                    date_time: new Date().toISOString(),
                                    status: pgSeguroStatusToEcomplus(Number(pgTransaction.status)),
                                    flags: ['pgseguro:updater']
                                  }
                                  appSdk.apiRequest(storeId, url, method, body).then(() => {
                                    logger.log(`> PagSeguroOrderUpdater: ${order._id} | ${current} --> ${pgSeguroStatusToEcomplus(Number(pgTransaction.status))} | #${storeId}`)
                                    nextOrder()
                                  })
                                    .catch(err => {
                                      logger.error(`> PagSeguroOrderUpdaterError: order #${order._id}`, err)
                                      nextOrder()
                                    })
                                } else {
                                  nextOrder()
                                }
                              })
                              .catch(err => {
                                // next order
                                const { response } = err
                                if (response.status !== 404) {
                                  const { headers, data } = response
                                  const { message } = err
                                  let failed = {
                                    message,
                                    data
                                  }

                                  if (data && typeof data === 'string' && headers['content-type'] === 'application/xml;charset=ISO-8859-1') {
                                    try {
                                      const error = JSON.parse(xmlToJSON.toJson(data))
                                      failed.pagseguroError = error
                                    } catch (error) {
                                      // igy igy 
                                    }
                                  }

                                  logger.error('[TransactionsUpdaterFailed]:', JSON.stringify(failed, undefined, 4))
                                }
                                nextOrder()
                              })
                          } else {
                            nextOrder()
                          }
                        } else {
                          nextOrder()
                        }
                      }

                      checkOrdersRecur(result)
                    })
                })
                .catch(err => {
                  //logger.error('CheckStoreOrdersErr', err)
                  nextStore()
                })
            }
            checkOrders(storeId)
          }
          // call
          checkStores(stores)
        })
        .catch(reject)
    })
  }

  const start = () => task()
    .finally(() => {
      // call again after 12 hours
      setTimeout(start, 1000 * 60 * 60 * 12)
    })
  // start after 10m
  start()
  setTimeout(start, 10 * 60 * 1000)
}

const pgSeguroStatusToEcomplus = code => {
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

'use strict'
// get instances of stores
const getStores = require('./get-stores')
const { getPagSeguroAuth } = require('./database')
const logger = require('console-files')
const PagSeguro = require('./pagseguro/pagseguro-client')

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
              getPagSeguroAuth(storeId)
                .then(pgAuth => {
                  const date = new Date()
                  date.setDate(date.getDate() - 7)
                  const url = 'orders.json?fields=_id,transactions,payments_history,financial_status' +
                    '&transactions.app.intermediator.code=pagseguro' +
                    `&created_at>=${date.toISOString()}` +
                    '&sort=financial_status.updated_at' +
                    '&limit=20'

                  // pagseguro client
                  const pgsClient = new PagSeguro({
                    appId: process.env.PS_APP_ID,
                    appKey: process.env.PS_APP_KEY,
                    authorizationCode: pgAuth.authorization_code
                  })

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
                            pgsClient
                              .trasaction
                              .getByCode(transaction.intermediator.transaction_code)
                              .then(pgTransaction => {
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
                                  logger.error('CheckOrderErr', err)
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
                  logger.error('CheckStoreOrdersErr', err)
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

'use strict'

// SQLite3 database client
// https://github.com/mapbox/node-sqlite3
const sqlite = require('sqlite3').verbose()
// log to files
const logger = require('console-files')

// setup table to reference PagHiper transaction to respective store
const dbFilename = process.env.DB_PATH || process.env.ECOM_AUTH_DB || './pagseguro.sqlite'
const dbTable = 'pagseguro_app_auth'

const db = new sqlite.Database(dbFilename, err => {
  const error = err => {
    // debug and destroy Node process
    logger.error(err)
    process.exit(1)
  }

  if (err) {
    error(err)
  } else {
    // try to run first query creating table
    db.run(
      `CREATE TABLE IF NOT EXISTS pagseguro_app_auth (
        id                  INTEGER  PRIMARY KEY AUTOINCREMENT,
        created_at          DATETIME DEFAULT (CURRENT_TIMESTAMP),
        authorization_code  STRING   NOT NULL,
        authorizer_email    STRING   NOT NULL,
        store_id            INTEGER  NOT NULL,
        public_key          STRING   NOT NULL,
        account_permissions STRING
      );
    `, err => {
        if (err) {
          error(err)
        }
      })

    db.run(
      `CREATE TABLE IF NOT EXISTS pagseguro_transaction (
        transaction_code     STRING  NOT NULL,
        transaction_status   INTEGER NOT NULL,
        transaction_store_id INTEGER NOT NULL
      );
    `, err => {
        if (err) {
          error(err)
        }
      })
  }
})

// abstracting DB statements with promise
const dbRunPromise = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, err => {
    if (err) {
      logger.error(err)
      reject(err)
    } else {
      // query executed with success
      resolve()
    }
  })
})

module.exports = {
  saveAuth(authorizationCode, authorizerEmail, storeId, publicKey, accountPermissions) {
    // insert a new row
    const sql = `INSERT INTO ${dbTable} (authorization_code,authorizer_email,store_id,public_key,account_permissions) VALUES (?, ?, ?, ?, ?)`
    return dbRunPromise(sql, [authorizationCode, authorizerEmail, storeId, publicKey, accountPermissions])
  },

  removeAuth(storeId) {
    // delete a row
    const sql = `DELETE FROM ${dbTable} WHERE store_id = ?`
    return dbRunPromise(sql, [storeId])
  },

  getPagSeguroAuth(storeId) {
    // find store and order for given PagHiper transaction code
    const sql = `SELECT * FROM ${dbTable} WHERE store_id = ? ORDER BY id DESC LIMIT 1`
    return new Promise((resolve, reject) => {
      db.get(sql, [storeId], (err, row) => {
        if (err) {
          logger.error(err)
          reject(err)
        } else if (row) {
          // found with success
          // resolve the promise returning respective store and order IDs
          resolve(row)
        } else {
          let err = new Error('PagSeguro authentication not found for store_id')
          err.name = 'AuthNotFound'
          reject(err)
        }
      })
    })
  },

  // transactions
  saveTransaction(code, status, storeId) {
    const sql = `INSERT INTO pagseguro_transaction (transaction_code, transaction_status, transaction_store_id) VALUES (?, ?, ?)`
    return dbRunPromise(sql, [code, status, storeId])
  },
  getTransaction(transactionCode) {
    // find store and order for given PagHiper transaction code
    const sql = `SELECT * FROM pagseguro_transaction WHERE transaction_code = ? LIMIT 1`
    return new Promise((resolve, reject) => {
      db.get(sql, [transactionCode], (err, row) => {
        if (err) {
          logger.error(err)
          reject(err)
        } else if (row) {
          // found with success
          // resolve the promise returning respective store and order IDs
          resolve(row)
        } else {
          let err = new Error('Transaction not found')
          err.name = 'NotFound'
          reject(err)
        }
      })
    })
  }
}

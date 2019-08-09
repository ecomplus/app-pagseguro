'use strict'
const PAGSEGURO_API_PATH = (process.env.PS_APP_SANDBOX && process.env.PS_APP_SANDBOX === 'true') ? 'https://ws.sandbox.pagseguro.uol.com.br' : 'https://ws.pagseguro.uol.com.br'
const axios = require('axios')
const xmlToJson = require('xml2json')
const { toXML } = require('jstoxml')
const { bankingBilletSchema, cardSchema, onlineDebitSchema } = require('./pagseguro-modules-response')
/**
 * PagSeguro client for E-Com Plus Apps
 */
class PagSeguro {
  constructor(...args) {
    this.appId = args[0].appId
    this.appKey = args[0].appKey
    this.authorizationCode = args[0].authorizationCode

    if (!this.appId || !this.appKey) {
      throw new Error('Could not construct a client with those parameters')
    }

    this.credentials = `appId=${this.appId}&appKey=${this.appKey}`
    if (this.authorizationCode) {
      this.credentials = `${this.credentials}&authorizationCode=${this.authorizationCode}`
    }
    this.trasaction = new Transaction(this)
    this.checkout = new Checkout(this)
    this.notification = new Notification(this)
    this.pay = new Pay(this)
    this.session = new Session(this)
    this.installments = new Installments(this)
    this.installmentsValue = {}
    this.params = {}
    this.payment = {}
    this.payWith = null
  }
}

class Transaction {
  constructor(client) {
    this.client = client
  }

  new(params) {
    const buyer = params.buyer || {}
    const address = params.to || params.billing_address
    this.client.params = params
    this.client.payment = {
      payment: {
        sender: {
          name: buyer.fullname || '',
          email: buyer.email || '',
          phone: {
            areaCode: buyer.phone.number.substr(0, 2),
            number: buyer.phone.number.substr(2, buyer.phone.number)
          },
          documents: {
            document: {
              type: buyer.registry_type === 'p' ? 'CPF' : 'CNPJ',
              value: buyer.doc_number
            }
          }
          // hash: 'HASH DO COMPRADOR?'
        },
        currency: 'BRL',
        notificationURL: process.env.PS_APP_NOTIFICATION_URL,
        items: [],
        reference: params.order_number,
        shippingAddressRequired: true,
        shipping: {
          address: {
            street: this.trimString(address.street) || '',
            number: address.number || '',
            district: address.borough || '',
            city: address.city,
            state: address.province_code,
            country: 'BRA',
            postalCode: address.zip
          },
          cost: params.amount.freight
        }
      }
    }

    params.items.forEach(item => {
      this.client.payment.payment.items.push({
        item: {
          id: item.sku,
          description: item.name,
          quantity: item.quantity,
          amount: parseFloat(item.price).toFixed(2)
        }
      })
    })

    return this.client.payment
  }

  trimString(string) {
    string = string.toLowerCase()
    string = string.replace(new RegExp('[ÁÀÂÃ]', 'gi'), 'a')
    string = string.replace(new RegExp('[ÉÈÊ]', 'gi'), 'e')
    string = string.replace(new RegExp('[ÍÌÎ]', 'gi'), 'i')
    string = string.replace(new RegExp('[ÓÒÔÕ]', 'gi'), 'o')
    string = string.replace(new RegExp('[ÚÙÛ]', 'gi'), 'u')
    string = string.replace(new RegExp('[Ç]', 'gi'), 'c')
    return string
  }
}

class Checkout {
  constructor(client) {
    this.client = client
  }

  onlineDebit() {
    this.client.payWith = 'onlineDebit'
    this.client.payment.payment = {
      mode: 'default',
      method: 'eft',
      bank: {
        name: 'itau'
      },
      ...this.client.payment.payment
    }
    return this.client.payment
  }

  bankingBillet() {
    this.client.payWith = 'bankingBillet'
    this.client.payment.payment = {
      mode: 'default',
      method: 'boleto',
      ...this.client.payment.payment
    }
    return this.client.payment
  }

  async card() {
    this.client.payWith = 'card'
    const address = this.client.params.to || this.client.params.billing_address
    const hashs = this.client.params.credit_card.hash.split(' // ')
    this.client.payment.payment.sender.hash = hashs[0]

    await this.client.session.new()
      .then(async session => {
        await this.client.installments.getInstallments(session, this.client.params.amount.total)
          .then(installment => {
            let installmentOptions = installment.installments.visa.find(option => option.quantity === this.client.params.installments_number)
            this.client.installmentsValue = {
              total: installmentOptions.totalAmount,
              value: installmentOptions.installmentAmount
            }
            this.client.payment.payment = {
              mode: 'default',
              method: 'creditCard',
              ...this.client.payment.payment,
              creditCard: {
                token: hashs[1],
                installment: {
                  quantity: this.client.params.installments_number,
                  value: installmentOptions.installmentAmount
                },
                holder: {
                  name: this.client.params.credit_card.holder_name,
                  documents: {
                    document: {
                      type: this.client.params.buyer.registry_type === 'p' ? 'CPF' : 'CNPJ',
                      value: this.client.params.buyer.doc_number
                    }
                  },
                  birthDate: this.convertDate(this.client.params.buyer.birth_date.day, this.client.params.buyer.birth_date.month, this.client.params.buyer.birth_date.year),
                  phone: {
                    areaCode: this.client.params.buyer.phone.number.substr(0, 2),
                    number: this.client.params.buyer.phone.number.substr(2, this.client.params.buyer.phone.number)
                  }
                },
                billingAddress: {
                  street: this.trimString(address.street) || '',
                  number: address.number || '',
                  district: address.borough || '',
                  city: address.city,
                  state: address.province_code,
                  country: 'BRA',
                  postalCode: address.zip
                }
              }
            }
            return this.client.payment
          })
      })
  }

  convertDate(day, month, year) {
    if (day < 10) {
      day = '0' + day
    }
    if (month < 10) {
      month = '0' + month
    }
    return `${day}/${month}/${year}`
  }

  trimString(string) {
    string = string.toLowerCase()
    string = string.replace(new RegExp('[ÁÀÂÃ]', 'gi'), 'a')
    string = string.replace(new RegExp('[ÉÈÊ]', 'gi'), 'e')
    string = string.replace(new RegExp('[ÍÌÎ]', 'gi'), 'i')
    string = string.replace(new RegExp('[ÓÒÔÕ]', 'gi'), 'o')
    string = string.replace(new RegExp('[ÚÙÛ]', 'gi'), 'u')
    string = string.replace(new RegExp('[Ç]', 'gi'), 'c')
    return string
  }
}

class Pay {
  constructor(client) {
    this.client = client
  }

  new() {
    return new Promise((resolve, reject) => {
      // request body
      let xml = '<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>'
      xml += toXML(this.client.payment)

      // request options
      const appId = this.client.appId
      const appKey = this.client.appKey
      const authorizationCode = this.client.authorizationCode
      const installmentValue = this.client.installmentsValue
      const resource = `${PAGSEGURO_API_PATH}/v2/transactions?appId=${appId}&appKey=${appKey}&authorizationCode=${authorizationCode}`

      const options = {
        url: resource,
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml; charset=ISO-8859-1'
        },
        data: xml
      }

      // request
      axios(options)
        .then(result => {
          return result.data
        })
        .then(data => {
          const payload = JSON.parse(xmlToJson.toJson(data))
          const schemas = function (method) {
            switch (method) {
              case 'onlineDebit': return onlineDebitSchema(payload)
              case 'bankingBillet': return bankingBilletSchema(payload)
              case 'card': return cardSchema(payload, installmentValue)
              default: return payload
            }
          }
          const schema = schemas(this.client.payWith)
          resolve({ payload, schema })
        })
        .catch(reject)
    })
  }
}

class Notification {
  constructor(client) {
    this.client = client
  }

  getNotification(notificationCode) {
    const appId = this.client.appId
    const appKey = this.client.appKey
    const resource = `${PAGSEGURO_API_PATH}/v3/transactions/notifications/${notificationCode}?appId=${appId}&appKey=${appKey}`
    const options = {
      url: resource,
      method: 'GET'
    }

    return axios(options)
      .then(result => {
        return result.data
      })
      .then(data => {
        const result = JSON.parse(xmlToJson.toJson(data))
        return result.transaction
      })
  }
}

class Session {
  constructor(client) {
    this.client = client
  }

  new() {
    return new Promise((resolve, reject) => {
      // request options
      const resource = `${PAGSEGURO_API_PATH}/v2/sessions?${this.client.credentials}`

      const options = {
        url: resource,
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml; charset=ISO-8859-1'
        }
      }

      // request
      axios(options)
        .then(result => {
          return result.data
        })
        .then(data => {
          const payload = JSON.parse(xmlToJson.toJson(data))
          resolve(payload.session.id)
        })
        .catch(reject)
    })
  }
}

class Installments {
  constructor(client) {
    this.client = client
  }

  getInstallments(session, amount, brand = 'visa') {
    return new Promise((resolve, reject) => {
      // request options
      const env = (process.env.PS_APP_SANDBOX && process.env.PS_APP_SANDBOX === 'true') ? 'sandbox.' : ''
      const resource = `https://${env}pagseguro.uol.com.br/checkout/v2/installments.json?sessionId=${session}&amount=${amount}&creditCardBrand=${brand}`

      const options = {
        url: resource,
        method: 'GET',
        headers: {
          'Content-Type': 'application/xml; charset=ISO-8859-1'
        }
      }

      // request
      axios(options)
        .then(result => {
          resolve(result.data)
        })
        .catch(reject)
    })
  }
}

module.exports = PagSeguro

/* using
try {
  const pags = new PagSeguro({
    appId: process.env.PS_APP_ID,
    appKey: process.env.PS_APP_KEY,
    authorizationCode: 'Egql5CAlLoljCc7ogytDt6bkG5jU6ixMZhryjZ'
  })
  pags.trasaction.new(params)
  pags.checkout.onlineDebit()
  pags.pay.new().then(payment => {
    console.log(payment)
  })
} catch (error) {
  console.error(error)
}
*/

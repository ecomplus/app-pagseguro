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

    this.trasaction = new Transaction(this)
    this.checkout = new Checkout(this)
    this.notification = new Notification(this)
    this.pay = new Pay(this)
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
          type: '3',
          cost: '0.00'
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

  card() {
    this.client.payWith = 'card'
    this.client.payment = {
      ...this.client.payment,
      mode: 'default',
      method: 'creditCard',
      creditCard: {
        token: this.client.params.credit_card.hash,
        installment: {
          quantity: this.client.params.credit_card.installments_number,
          value: this.client.params.amount.total / this.client.params.credit_card.installments_number
        },
        holder: {
          name: this.client.params.credit_card.holder_name,
          documents: {
            document: {
              type: this.client.params.buyer.registry_type === 'p' ? 'CPF' : 'CNPJ',
              value: this.client.params.buyer.doc_number
            }
          },
          birthDate: `${this.client.params.payer.birth_date.day}/${this.client.params.payer.birth_date.month}/${this.client.params.payer.birth_date.year}`,
          phone: {
            areaCode: this.client.params.buyer.phone.number.substr(0, 2),
            number: this.client.params.buyer.phone.number.substr(2, this.client.params.buyer.phone.number)
          }
        }
      }
    }
    return this.client.payment
  }
}

class Pay {
  constructor(client) {
    this.client = client
  }

  new() {
    // request body
    let xml = '<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>'
    xml += toXML(this.client.payment)

    // request options
    const appId = this.client.appId
    const appKey = this.client.appKey
    const authorizationCode = this.client.authorizationCode
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
    return axios(options)
      .then(result => {
        return result.data
      })
      .then(data => {
        const payload = JSON.parse(xmlToJson.toJson(data))
        const schemas = function (method) {
          switch (method) {
            case 'onlineDebit': return onlineDebitSchema(payload)
            case 'bankingBillet': return bankingBilletSchema(payload)
            case 'card': return cardSchema(payload)
            default: return payload
          }
        }

        const schema = schemas(this.client.payWith)
        return Promise.resolve({ payload, schema })
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

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

    if (!this.appId || !this.appKey || !this.authorizationCode) {
      throw new Error('Could not construct a client with those parameters')
    }

    this.trasaction = new Transaction(this)
    this.checkout = new Checkout(this)
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
          amount: parseFloat(item.price)
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
        // resolve(JSON.parse(xmlToJson.toJson(data)))
        // return JSON.parse(xmlToJson.toJson(data))
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

const params = {
  items: [
    {
      quantity: 1,
      product_id: '5d3b4508fcc98e1f62833ca7',
      variation_id: '986190156416538629800005',
      sku: 'CPO7520-721-2',
      name: 'Cruzeiro 2019 / M / azul',
      currency_id: 'BRL',
      currency_symbol: 'R$',
      price: 22.01,
      final_price: 22
    }
  ],
  amount: {
    total: 12.22,
    subtotal: 2,
    discount: 0,
    freight: 10.22
  },
  order_id: '5d433911fcc98e1f6283cec8',
  order_number: 5980,
  to: {
    zip: '30140-072',
    name: 'Lucas Toledo',
    street: 'Rua dos Aimorés',
    number: 21,
    borough: 'Lourdes',
    city: 'Belo Horizonte',
    province_code: 'MG'
  },
  payment_method: {
    code: 'credit_card',
    name: 'Cartão Credito'
  },
  type: 'payment',
  buyer: {
    email: 'c84867540252603566692@sandbox.pagseguro.com.br',
    fullname: 'Lucas Toledo',
    doc_number: '31807153835',
    registry_type: 'p',
    birth_date: {
      year: 1990,
      month: 12,
      day: 21
    },
    phone: {
      number: '31999182888'
    },
    customer_id: '5cb8ed97887ef430f1f66c94'
  },
  installments_number: 1,
  credit_card: {
    holder_name: 'Matheus G N Reis',
    last_digits: '1545',
    save: true,
    hash: 'Yl/oyD3Od3EVNHD764G8tLPEnqMoLsQLGqGrczhKDHiu4Kp7WA4R8/e9qaTYWipbIZ3f7yGm5rXgu88Zjs+m8ngti/6QYrGQDSaD/rFZjFaxoijq1KJSk8RnnqzPdpRMUiUHzy+fLg37rSaImgIKOaQY8uBme5WqIpOqi50MAVONkxKRgQtn98NW0BrKlIC08t3vZVAWKyt9QMWW/kZhsSv4Ors6e4AXGULLchGF1mSqbpsWPl/o5Z30ubxbdZqfxZkRYsX69kuz6q5yeyVd637VPgntALbrVUOaz3DoPSu9FOJSo8z3Sban0IWV8/J6z7q5saMwAgB7HhQrBCsH2w==',
    cvv: 234
  },
  billing_address: {
    zip: '30140-072',
    name: 'Lucas Toledo',
    street: 'Rua dos Aimorés',
    number: 21,
    borough: 'Lourdes',
    city: 'Belo Horizonte',
    province_code: 'MG'
  },
  payer: {
    fullname: 'Matheus G N Reis',
    doc_number: '08728398696',
    birth_date: {
      year: 1994,
      month: 7,
      day: 21
    }
  },
  channel_type: 'ecommerce',
  currency_id: 'BRL',
  currency_symbol: 'R$'
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

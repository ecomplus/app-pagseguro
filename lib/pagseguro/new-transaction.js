
module.exports = (params, isPaymentLink) => {
  const { buyer } = params
  const address = params.to || params.billing_address
  const notificationURL = process.env.PS_APP_NOTIFICATION_URL

  const payload = {
    sender: {
      name: String(buyer.fullname).substr(0, 50),
      email: String(buyer.email).substr(0, 60),
      phone: {
        areaCode: buyer.phone.number.substr(0, 2),
        number: buyer.phone.number.substr(2, buyer.phone.number)
      },
      documents: {
        document: {
          type: buyer.registry_type === 'p' ? 'CPF' : 'CNPJ',
          value: buyer.doc_number
        }
      },
      hash: params.intermediator_buyer_id
    },
    currency: 'BRL',
    notificationURL,
    items: [],
    reference: String(params.order_number).substr(0, 200),
    shipping: {
      address: {
        street: String(trimString(address.street)).substr(0, 80),
        number: String(address.number || 'SN'),
        district: String(address.borough || '').substr(0, 60),
        city: String(address.city).substr(0, 60),
        state: String(address.province_code).substr(0, 2),
        country: 'BRA',
        postalCode: String(address.zip).replace(/\D/g, '').substr(0, 8)
      },
      cost: params.amount && params.amount.freight ? params.amount.freight : 0,
      type: 3
    },
    extraAmount: parseFloat(params.amount ? -params.amount.discount : 0).toFixed(2)
  }
  if (isPaymentLink) {
    payload.shippingAddressRequired = true
  }

  params.items.forEach(item => {
    if (item.final_price > 0 || item.price > 0) {
      payload.items.push({
        item: {
          id: String(item.sku).substr(0, 100),
          description: String(item.name).substr(0, 100),
          quantity: item.quantity,
          amount: parseFloat(item.final_price || item.price).toFixed(2)
        }
      })
    }
  })

  return payload
}

const trimString = (string) => {
  if (typeof string === 'string') {
    string = string.toLowerCase()
    string = string.replace(new RegExp('[ÁÀÂÃ]', 'gi'), 'a')
    string = string.replace(new RegExp('[ÉÈÊ]', 'gi'), 'e')
    string = string.replace(new RegExp('[ÍÌÎ]', 'gi'), 'i')
    string = string.replace(new RegExp('[ÓÒÔÕ]', 'gi'), 'o')
    string = string.replace(new RegExp('[ÚÙÛ]', 'gi'), 'u')
    string = string.replace(new RegExp('[Ç]', 'gi'), 'c')
    return string
  } else {
    return ''
  }
}

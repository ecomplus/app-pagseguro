
module.exports = params => {
  const { buyer } = params
  const address = params.to || params.billing_address

  const payload = {
    sender: {
      name: buyer.fullname,
      email: buyer.email,
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
    notificationURL: process.env.PS_APP_NOTIFICATION_URL,
    items: [],
    reference: params.order_number,
    shippingAddressRequired: true,
    shipping: {
      address: {
        street: trimString(address.street),
        number: address.number || 'SN',
        district: address.borough || '',
        city: address.city,
        state: address.province_code,
        country: 'BRA',
        postalCode: address.zip
      },
      cost: params.amount && params.amount.freight ? params.amount.freight : 0
    },
    extraAmount: parseFloat(params.amount ? -params.amount.discount : 0).toFixed(2)
  }

  params.items.forEach(item => {
    payload.items.push({
      item: {
        id: item.sku,
        description: item.name,
        quantity: item.quantity,
        amount: parseFloat(item.final_price || item.price).toFixed(2)
      }
    })
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
'use strict'

const cardSchema = (payload, installmentValue) => {
  return {
    'redirect_to_payment': false,
    'transaction': {
      'amount': Number(payload.transaction.grossAmount),
      'creditor_fees': {
        'installment': Number(payload.transaction.installmentCount),
        'intermediation': Number(payload.transaction.feeAmount)
      },
      'currency_id': 'BRL',
      'installments': {
        'number': Number(payload.transaction.installmentCount),
        'tax': (payload.transaction.feeAmount > 0),
        'total': installmentValue.total,
        'value': installmentValue.value
      },
      'intermediator': {
        'payment_method': {
          'code': 'credit_card',
          'name': 'Cartão de Crédito'
        },
        'transaction_id': payload.transaction.code,
        'transaction_code': payload.transaction.code,
        'transaction_reference': payload.transaction.reference
      },
      'status': {
        'current': paymentStatus(payload.transaction.status)
      }
    }
  }
}

const onlineDebitSchema = payload => {
  return {
    'redirect_to_payment': false,
    'transaction': {
      'amount': Number(payload.transaction.grossAmount),
      'payment_link': payload.transaction.paymentLink
    }
  }
}

const bankingBilletSchema = payload => {
  return {
    'redirect_to_payment': false,
    'transaction': {
      'amount': Number(payload.transaction.grossAmount),
      'banking_billet': {
        'link': payload.transaction.paymentLink,
      },
      'creditor_fees': {
        'installment': parseInt(payload.transaction.installmentCount),
        'intermediation': Number(payload.transaction.grossAmount)
      },
      'currency_id': 'BRL',
      'installments': {
        'number': parseInt(payload.transaction.installmentCount)
      },
      'intermediator': {
        'payment_method': {
          'code': 'banking_billet',
          'name': 'Boleto'
        },
        'transaction_id': payload.transaction.code,
        'transaction_code': payload.transaction.code,
        'transaction_reference': payload.transaction.reference
      },
      'payment_link': payload.transaction.paymentLink,
      'status': {
        'current': paymentStatus(payload.transaction.status)
      }
    }
  }
}

const paymentStatus = code => {
  switch (Number(code)) {
    case 1: return 'under_analysis'
    case 2: return 'authorized'
    case 3: return 'under_analysis'
    case 4: return 'refunded'
    case 5: return 'voided'
    default: return 'unknown'
  }
}

module.exports = { cardSchema, onlineDebitSchema, bankingBilletSchema }

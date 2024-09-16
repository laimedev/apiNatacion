const axios = require('axios').default

exports.createFormToken = async paymentConf => {
  // format: 123456789
  let username = process.env.IZIPAY_USERNAME  
  let endpoint = process.env.IZIPAY_ENDPOINT
  let password

  if(process.env.MODE === "TEST") {
    password = process.env.IZIPAY_PASSPORD_TEST;
  }
  else {
    password = process.env.IZIPAY_PASSPORD;
  }

  const createPaymentEndpoint = `https://${username}:${password}@${endpoint}/api-payment/V4/Charge/CreatePayment`

  try {
    const response = await axios.post(createPaymentEndpoint, paymentConf, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (!response?.data?.answer?.formToken) throw response
    return response.data.answer.formToken
  } catch (error) {
    throw error
  }
}

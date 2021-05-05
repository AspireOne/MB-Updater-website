'use strict';
const paypal = require("@paypal/checkout-server-sdk");
const paypalClient = (require('netlify/functions/paypalClient')).client();

exports.handler = async (event, context) => {
    // Call PayPal to set up a transaction.
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'CZK',
                value: '49.99'
            }
        }]
    });

    let order;
    try {
        order = await paypalClient.execute(request);
    } catch (err) {
        // Handle any errors from the call.
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err }),
        }
    }

    // Return a successful response to the client with the order ID.
    return {
        statusCode: 200,
        body: JSON.stringify({orderID: order.result.id}), /*or you can try order.id*/
    }
}
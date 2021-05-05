'use strict';
const paypal = require('@paypal/checkout-server-sdk');
const paypalClient = (require('netlify/functions/paypalClient')).client();

exports.handler = async (event, context) => {
    // Get the order ID from the request body.
    const orderID = event.queryStringParameters.orderID;

    // Call PayPal to capture the order.
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    let response;
    try {
        response = await paypalClient.execute(request);
        // Save the capture ID to your database. Implement logic to save capture to your database for future reference.
        // const captureID = capture.result.purchase_units[0].payments.captures[0].id;
        // await database.saveCaptureID(captureID);
    } catch (err) {
        // Handle any errors from the call.
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err }),
        }
    }

    // Return a successful response to the client.
    // Maybe return the generated key.
    return {
        statusCode: 200,
        body: JSON.stringify({response: response.result, key: "[a key will be here]"}),
    }
}
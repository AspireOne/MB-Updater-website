const paypal = require('@paypal/checkout-server-sdk');
const sandbox = true;
// Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
const environment = () => sandbox ? new paypal.core.SandboxEnvironment(process.env.SANDBOX_CLIENT_ID, process.env.SANDBOX_CLIENT_SECRET) : new paypal.core.LiveEnvironment(process.env.LIVE_CLIENT_ID, process.env.LIVE_CLIENT_SECRET);
/* Returns PayPal HTTP client instance with environment that has access credentials context.
   Use this instance to invoke PayPal APIs, provided the credentials have access. */

const client = () => new paypal.core.PayPalHttpClient(environment());

exports.handler = async(event, context) => {
    console.log("sandbox: " + process.env.SANDBOX);
    const orderAction = event.queryStringParameters.orderAction;
    const orderId = event.queryStringParameters.orderID;

    console.log("passed orderAction: " + orderAction);
    console.log("passed orderId: " + orderId);

    if (orderAction == 'create')
        return createOrder(client());

    if (orderAction == 'capture') {
        return orderId
            ? captureOrder(client(), orderId)
            : { statusCode: 400, body: JSON.stringify({error: 'no order ID passed.'}) };
    }

    return { statusCode: 400, body: JSON.stringify({error: 'no action specified or bad format'}) }
}

async function createOrder(client) {
    // Call PayPal to set up a transaction.
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=minimal');
    request.requestBody({
        intent: 'CAPTURE',
        application_context: { shipping_preference: "NO_SHIPPING" },
        purchase_units: [{
            amount: {
                currency_code: 'CZK',
                value: '69.99'
            }
        }]
    });

    try {
        const response = await client.execute(request);
        console.log(`Order Created. Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(`Order: ${JSON.stringify(response.result)}`);

        // Return a successful serverResponse to the client with the order ID.
        return { statusCode: 200, body: JSON.stringify({ serverResponse: response, id: response.result.id }) }
    } catch (error) {
        console.error("Order Not Created. Error: " + error);
        return { statusCode: 500, body: JSON.stringify({error: error}) }
    }
}

async function captureOrder(client, orderId) {
    // Call PayPal to capture the order.
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    console.log("Capturing Order. Id: " + orderId);

    try {
        let response = await client.execute(request);
        console.log(`Order Captured. Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(`Capture: ${JSON.stringify(response.result)}`);

        return { statusCode: 200, body: JSON.stringify({ serverResponse: response, key: '[a key will be here]' }) }
        // Save the capture ID to your database. Implement logic to save capture to your database for future reference.
        // const captureID = capture.result.purchase_units[0].payments.captures[0].id;
        // await database.saveCaptureID(captureID);
    } catch (error) {
        console.error("Order Not Captured. Error: " + error);
        return { statusCode: 500, body: JSON.stringify({error: error}) }
    }
}
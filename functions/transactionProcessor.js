const paypal = require('@paypal/checkout-server-sdk');
/* Returns PayPal HTTP client instance with environment that has access credentials context.
   Use this instance to invoke PayPal APIs, provided the credentials have access. */
const client = () => new paypal.core.PayPalHttpClient(environment());
// Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
const environment = () => process.env.SANDBOX
    ? new paypal.core.SandboxEnvironment(process.env.SANDBOX_CLIENT_ID, process.env.SANDBOX_CLIENT_SECRET)
    : new paypal.core.LiveEnvironment(process.env.LIVE_CLIENT_ID, process.env.LIVE_CLIENT_SECRET);

exports.handler = async (event, context) => {
    console.log("sandbox: " + process.env.SANDBOX);
    const orderAction = event.queryStringParameters.orderAction;
    const orderId = event.queryStringParameters.orderID;

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
        const serverResponse = await client.execute(request);
        console.log('order successfuly created');
        // Return a successful serverResponse to the client with the order ID.
        return { statusCode: 200, body: JSON.stringify({ serverResponse: serverResponse, id: serverResponse.result.id }) }
    } catch (err) {
        console.error("Could not create order. Err: " + err);
        return { statusCode: 500, body: JSON.stringify({error: err}) }
    }
}

async function captureOrder(client, orderId) {
    // Call PayPal to capture the order.
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    console.log("Capturing order. Id: " + orderId);

    try {
        let serverResponse = await client.execute(request);
        console.log('successfuly captured order');
        return { statusCode: 200, body: JSON.stringify({ serverResponse: serverResponse, key: '[a key will be here]' }) }
        // Save the capture ID to your database. Implement logic to save capture to your database for future reference.
        // const captureID = capture.result.purchase_units[0].payments.captures[0].id;
        // await database.saveCaptureID(captureID);
    } catch (err) {
        console.error("Could not capture order. Err: " + err);
        return { statusCode: 500, body: JSON.stringify({error: err}) }
    }
}
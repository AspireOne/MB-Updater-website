const paypal = require('@paypal/checkout-server-sdk');
const nodemailer = require("nodemailer");
const faunadb = require('faunadb')
const q = faunadb.query;
const sandbox = false;

// Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
const environment = () => sandbox ? new paypal.core.SandboxEnvironment(process.env.SANDBOX_CLIENT_ID, process.env.SANDBOX_CLIENT_SECRET) : new paypal.core.LiveEnvironment(process.env.LIVE_CLIENT_ID, process.env.LIVE_CLIENT_SECRET);
/* Returns PayPal HTTP client instance with environment that has access credentials context.
   Use this instance to invoke PayPal APIs, provided the credentials have access. */
const paypalClient = () => new paypal.core.PayPalHttpClient(environment());

exports.handler = async(event, context) => {
    console.log("sandbox: " + process.env.SANDBOX);
    const orderAction = event.queryStringParameters.orderAction;
    const orderId = event.queryStringParameters.orderID;

    console.log("passed orderAction: " + orderAction);
    console.log("passed orderId: " + orderId);

    if (orderAction == 'create')
        return createOrder(paypalClient());

    if (orderAction == 'capture') {
        return orderId
            ? captureOrder(paypalClient(), orderId)
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

function createKey() {
    const characters = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const keyLength = 4;
    let key = "";

    for (let i = 0; i < keyLength; ++i)
        key += characters[Math.floor(Math.random() * characters.length)];

    return key;
}

async function sendKey(emailReceiver, key) {
    const transporter = nodemailer.createTransport({
        host: "smtp.seznam.cz",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
    });

    const info = await transporter.sendMail({
        from: `Aplikace Mimibazar Aktualizace ${process.env.EMAIL_USER}`,
        to: emailReceiver,
        subject: "Klíč k plné verzi aplikace (" + key + ")",
        text: "Dobrý den,\n\nDěkujeme za zakoupení aplikace Mimibazar Aktualizace." +
            " Váš klíč k plné verzi je " + key + ". V případě jakýchkoli potíží či podnětů neváhejte napsat na mimibazar.aktualizace@email.cz.\n\n" +
            "Hezký zbytek dne vám přeje tým aplikace Mimibazar Aktualizace.",
        html: "Dobrý den,<br><br>Děkujeme za zakoupení aplikace <a href='https://mimibazar-aktualizace.netlify.app/'>Mimibazar Aktualizace</a>. " +
            `<a href='https://mimibazar-aktualizace.netlify.app/plna-verze'>Váš klíč</a> k plné verzi je <strong>${key}</strong>.` +
            "V případě jakýchkoli potíží či podnětů neváhejte napsat na mimibazar.aktualizace@email.cz." +
            "<br><br>Hezký zbytek dne vám přeje tým aplikace Mimibazar Aktualizace."
    });

    console.log("Email sent. Info: " + JSON.stringify(info));
}

function registerKey(payer, key) {
    const dbClient = new faunadb.Client({ secret: process.env.FAUNADB_SERVER_SECRET });

    const data = {
        key: key,
        payerEmail: payer.email_address,
        payerGivenName: payer.name.given_name,
        payerSurname: payer.name.surname,
    };

    const dbResult = dbClient.query(q.Create(q.Collection("keys"), {data: data}))
        .then((response) => console.log("db success. " + JSON.stringify(response)))
        .catch((error) => console.log("db failure. " + JSON.stringify(error)));

    console.log(dbResult);
}

async function captureOrder(client, orderId) {
    // Call PayPal to capture the order.
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    console.log("Capturing Order. Id: " + orderId);

    try {
        let response = await client.execute(request);
        const key = createKey();
        console.log(`Order Captured. Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(`Capture: ${JSON.stringify(response.result)}`);

        registerKey(response.result.payer, key);
        await sendKey(response.result.payer.email_address, key);

        return { statusCode: 200, body: JSON.stringify({ serverResponse: response, key: key }) }
        // Save the capture ID to your database. Implement logic to save capture to your database for future reference.
        // const captureID = capture.result.purchase_units[0].payments.captures[0].id;
        // await database.saveCaptureID(captureID);
    } catch (error) {
        console.error("Order Not Captured. Error: " + error);
        return { statusCode: 500, body: JSON.stringify({error: error}) }
    }
}
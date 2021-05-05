'use strict';
const paypal = require('@paypal/checkout-server-sdk');

/* Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access. */
function client() {
    return new paypal.core.PayPalHttpClient(environment); /* or you can try environment() */
}

/* Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use LiveEnvironment. */
function environment() {
    let clientId = process.env.PAYPAL_CLIENT_ID || 'ATvjYmIF8j_rHZkVcoyXPYSTXgvDzVUcaK6AQ4_VJ6yuwDk6flESnrMhlv1xuRNvPhiUc1EXWPmnjWLF';
    let clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'EIGki7sQR78oLjQoVATusp2TfSa34OGF2NrIx9v-oaHkM3yxEyZPtYUYKQazXM4nKK5ko8BF3zj2jkkA';

    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

async function prettyPrint(jsonData, pre="") {
    let pretty = "";
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    for (let key in jsonData) {
        if (jsonData.hasOwnProperty(key)){
            if (isNaN(key))
                pretty += pre + capitalize(key) + ": ";
            else
                pretty += pre + (parseInt(key) + 1) + ": ";
            if (typeof jsonData[key] === "object"){
                pretty += "\n";
                pretty += await prettyPrint(jsonData[key], pre + "    ");
            }
            else {
                pretty += jsonData[key] + "\n";
            }

        }
    }
    return pretty;
}

module.exports = {client: client, prettyPrint:prettyPrint};
export default function setUp() {
    paypal.Buttons({
        // Call your server to set up the transaction.
        createOrder: function(data, actions) {
            console.log("Calling server to create Order.");
            return fetch('/.netlify/functions/transactionProcessor?orderAction=create', {
                method: 'post',
            }).then(function(functionResponse) {
                console.log("Server Created Order.");
                return functionResponse.json();
            }).then(function(functionResponseJson) {
                console.log("Order Id: " + functionResponseJson.id);
                return functionResponseJson.id;
            });
        },

        // Call your server to finalize the transaction.
        onApprove: function(data, actions) {
            console.log("capturing (finalizing) transaction with id: " + data.orderID);
            return fetch('/.netlify/functions/transactionProcessor?orderAction=capture&orderID=' + data.orderID, {
                method: 'post'
            }).then(function(functionResponse) {
                return functionResponse.json();
            }).then(function(functionResponseJson) {
                const appKey = functionResponseJson.key;
                const transaction = functionResponseJson.serverResponse.result;
                const errorDetail = Array.isArray(transaction.details) && transaction.details[0];

                if (errorDetail && errorDetail.issue === 'INSTRUMENT_DECLINED')
                    return actions.restart(); // Recoverable state https://developer.paypal.com/docs/checkout/integration-features/funding-failure/

                if (errorDetail || (functionResponseJson.serverResponse.statusCode != 201)) {
                    let msg = 'Omlouváme se, ale transakce nemohla být dokončena.';
                    if (errorDetail.description)
                        msg += '\n\n(' + errorDetail.description + ')';
                    if (transaction.debug_id)
                        msg += ' (' + transaction.debug_id + ')';
                    return alert(msg); // Show a failure message.
                }

                window.localStorage.setItem("email", transaction.payer.email_address);
                window.localStorage.setItem("klic", appKey);

                window.open("/plna-verze","_self");
            });
        }

    }).render('#paypal-button-container');
}
export default function setUp() {
    paypal.Buttons({
        // Call your server to set up the transaction
        createOrder: function(data, actions) {
            console.log("creating order");
            return fetch('/.netlify/functions/transactionProcessor?orderAction=create', {
                method: 'post'
            }).then(function(functionResponse) {
                return functionResponse.json();
            }).then(function(functionResponseJson) {
                return functionResponseJson.id;
            });
        },

        // Call your server to finalize the transaction.
        onApprove: function(id, actions) {
            console.log("capturing (finalizing) transaction.");
            return fetch('/.netlify/functions/transactionProcessor?orderAction=capture&orderID=' + id.orderID, {
                method: 'post'
            }).then(function(functionResponse) {
                return functionResponse.json();
            }).then(function(functionResponseJson) {
                const appKey = functionResponseJson.key;
                const transaction = functionResponseJson.serverResponse.result;
                const transactionInfo = {
                    status: transaction.status,
                    payerName: transaction.payer.name.given_name,
                    payerSurname: transaction.payer.name.surname,
                    payerMail: transaction.payer.email_address,
                }
                console.log("transaction captured. Transaction info: " + JSON.stringify(transactionInfo));

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

                // Show a success message.
                alert('Transakce úspěšně dokončena uživatelem ' + transactionInfo.payerName + " " + transactionInfo.payerSurname);
            });
        }

    }).render('#paypal-button-container');
}
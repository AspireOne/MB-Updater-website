const tilt = 6;
const delay = 0;
let transX = 0;
let transY = 0;
let cachedX = {max: 0, middle: 0, divisor: 0};
let cachedY = {max: 0, middle: 0, divisor: 0};

window.onload = function() {
    AOS.init({
        duration: 1000,
        once: true,
    });

    if (!isTouchDevice())
        window.addEventListener("mousemove", e => handleMouseMove(e.clientX, e.clientY));
}

document.addEventListener('mouseenter', function() {
    const effectDurationMs = 110;
    document.getElementById("header-icon").style.transition = effectDurationMs/1000 + "s";
    setTimeout(function() {
        document.getElementById("header-icon").style.transition = "0s";
    }, effectDurationMs + 50);
});

function handleMouseMove(x, y) {
    let newTransX = computeTransform(cachedX, getWindowWidth(), x, tilt);
    let newTransY = computeTransform(cachedY, getWindowHeight(), y, tilt);

    if (delay == 0)
        applyChange();
    else
        setTimeout(() => applyChange(), delay);

    function applyChange() {
        transX = newTransX;
        transY = newTransY;
        document.getElementById("header-icon").style.transform = `translate(${transX}px, ${transY}px)`;
    }

    function computeTransform(cached, max, mousePos, maxTilt) {
        const stays = cached.max === max;
        cached.max = max;
        const middle = stays ? cached.middle : (cached.middle = max / 2);
        const divisor = stays ? cached.divisor : (cached.divisor = middle / maxTilt);

        return (middle - mousePos) / divisor;
    }
}

function getWindowWidth() {
    return Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
    );
}

function getWindowHeight() {
    return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
    );
}

function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}



// Render the PayPal button into #paypal-button-container
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
            const licenseKey = functionResponseJson.key;
            const transaction = functionResponseJson.serverResponse.result;

            const transactionInfo = {
                status: transaction.status,
                payerName: transaction.payer.name.given_name,
                payerSurname: transaction.payer.name.surname,
                payerMail: transaction.payer.email_address,
            }
            console.log("transaction captured. Transaction info: " + JSON.stringify(transactionInfo));
            // Three cases to handle:
            //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
            //   (2) Other non-recoverable errors -> Show a failure message
            //   (3) Successful transaction -> Show confirmation or thank you

            // This example reads a v2/checkout/orders capture serverResponse, propagated from the server
            // You could use a different API or structure for your 'orderData'

            const errorDetail = Array.isArray(transaction.details) && transaction.details[0];
            if (errorDetail && errorDetail.issue === 'INSTRUMENT_DECLINED') {
                return actions.restart(); // Recoverable state, per:
                // https://developer.paypal.com/docs/checkout/integration-features/funding-failure/
            }

            if (errorDetail || (functionResponseJson.serverResponse.statusCode != 201)) {
                let msg = 'Omlouváme se, ale transakce nemohla být dokončena.';
                if (errorDetail.description)
                    msg += '\n\n(' + errorDetail.description + ')';
                if (transaction.debug_id)
                    msg += ' (' + transaction.debug_id + ')';
                return alert(msg); // Show a failure message
            }

            // Show a success message
            alert('Transakce úspěšně dokončena uživatelem ' + transactionInfo.payerName + " " + transactionInfo.payerSurname);
        });
    }

}).render('#paypal-button-container');
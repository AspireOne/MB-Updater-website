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
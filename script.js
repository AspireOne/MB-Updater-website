window.onload = function () {
    AOS.init();
    if (!isTouchDevice())
        window.addEventListener("mousemove", e => handleMouseMove(e));
}

const tilt = 7;
const delay = 150;
let transX = 0;
let transY = 0;
let cachedX = {max: 0, middle: 0, divisor: 0};
let cachedY = {max: 0, middle: 0, divisor: 0};

function handleMouseMove(e) {
    let newTransX = computeTransform(cachedX, getWindowWidth(), e.clientX, tilt);
    let newTransY = computeTransform(cachedY, getWindowHeight(), e.clientY, tilt);

    setTimeout(() => {
        transX = newTransX;
        transY = newTransY;
        document.getElementById("header-icon").style = `transform: translate(${transX}px, ${transY}px)`;
    }, delay);

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
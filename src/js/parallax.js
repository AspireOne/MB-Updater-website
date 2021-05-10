import {getWindowWidth, getWindowHeight} from "./utils.js";

export default class Parallaxed {
    parallaxed = false;
    object;
    tilt;
    delay;
    transX = 0;
    transY = 0;
    cachedX = {max: 0, middle: 0, divisor: 0};
    cachedY = {max: 0, middle: 0, divisor: 0};

    constructor(obj, tilt = 6, delay = 0) {
        if (!obj)
            throw Error("Object that was passed to be parallaxed doesn't exist.");

        this.object = obj;
        this.tilt = tilt;
        this.delay = delay;
    }

    makeParallaxed() {
        if (this.parallaxed)
            return;
        
        this.parallaxed = true;
        document.addEventListener("mousemove", e => this.handleMouseMove(e.clientX, e.clientY));
        document.addEventListener('mouseenter', () => {
            const effectDurationMs = 110;
            this.object.style.transition = effectDurationMs/1000 + "s";
            setTimeout(() => this.object.style.transition = "0s", effectDurationMs + 50);
        })
    }

    handleMouseMove(x, y) {
        let newTransX = this.computeTransform(this.cachedX, getWindowWidth(), x, this.tilt);
        let newTransY = this.computeTransform(this.cachedY, getWindowHeight(), y, this.tilt);

        if (this.delay == 0)
            this.applyChange(newTransX, newTransY);
        else
            setTimeout(() => this.applyChange(newTransX, newTransY), this.delay);
    }

    applyChange(newTransX, newTransY) {
        this.transX = newTransX;
        this.transY = newTransY;
        this.object.style.transform = `translate(${this.transX}px, ${this.transY}px)`;
    }

    computeTransform(cached, max, mousePos, maxTilt) {
        const stays = cached.max === max;
        cached.max = max;
        const middle = stays ? cached.middle : (cached.middle = max / 2);
        const divisor = stays ? cached.divisor : (cached.divisor = middle / maxTilt);

        return (middle - mousePos) / divisor;
    }
}
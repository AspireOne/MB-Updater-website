'use strict';

import {isTouchDevice} from "./utils.js";
import Parallaxed from "./parallax.js";
import AOS from "aos";
import setUp from "./paypalButtonSetup.js";

window.onload = () => AOS.init({ duration: 1000, once: true });

document.addEventListener("DOMContentLoaded", () => {
    if (!isTouchDevice())
        new Parallaxed(document.getElementById("header-icon"), 6, 0).makeParallaxed();
});

setUp();
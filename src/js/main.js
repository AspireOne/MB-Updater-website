'use strict';

import {isTouchDevice} from "./utils.js";
import Parallaxed from "./parallax.js";
import AOS from "aos";
import setUp from "./paypalButtonSetup.js";

window.onload = () => {setUp();}

document.addEventListener("DOMContentLoaded", () => {
    if (!isTouchDevice())
        new Parallaxed(document.getElementById("header-icon"), 6, 0).makeParallaxed();
    AOS.init({duration: 1000, once: true});

    if (localStorage.getItem("klic") !== null) {
        document.getElementById("key").innerText = "Váš klíč je " + localStorage.getItem("klic");
        document.getElementById("key").style.display = "block";
    }
});
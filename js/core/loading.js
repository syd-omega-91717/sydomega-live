/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/loading.js
 * Version: RC3.1.015
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Loading {

        show() {

            document.body.classList.add("omega-loading");

        }

        hide() {

            document.body.classList.remove("omega-loading");

        }

    }

    Omega.Loading = new Loading();

})(window);

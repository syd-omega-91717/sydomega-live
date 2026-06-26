/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/components.js
 * Version: RC3.1.017
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Components {

        async load(selector, url) {

            const response = await fetch(url);

            const html = await response.text();

            const element = document.querySelector(selector);

            if (element) {

                element.innerHTML = html;

            }

        }

    }

    Omega.Components = new Components();

})(window);

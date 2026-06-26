/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/router.js
 * Version: RC3.1.011
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Router {

        go(page) {

            location.href = page;

        }

        reload() {

            location.reload();

        }

        back() {

            history.back();

        }

        current() {

            return location.pathname.split("/").pop();

        }

    }

    Omega.Router = new Router();

})(window);

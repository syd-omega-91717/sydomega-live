/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/notifications.js
 * Version: RC3.1.013
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Notifications {

        success(message) {

            console.log("✅ " + message);

        }

        error(message) {

            console.error("❌ " + message);

        }

        warning(message) {

            console.warn("⚠️ " + message);

        }

        info(message) {

            console.info("ℹ️ " + message);

        }

    }

    Omega.Notify = new Notifications();

})(window);

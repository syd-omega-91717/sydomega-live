/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/kernel.js
 * Version: RC3.1.008
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Kernel {

        async boot(moduleName) {

            Omega.Logger.info("Booting Platform");

            Omega.State.set("module", moduleName);

            Omega.Events.emit("kernel.boot", {

                module: moduleName

            });

            Omega.Logger.success(moduleName + " initialized");

        }

    }

    Omega.Kernel = new Kernel();

})(window);

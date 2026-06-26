/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/application.js
 * Version: RC3.1.009
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Application {

        async start(moduleName) {

            await Omega.Kernel.boot(moduleName);

            Omega.Logger.success("Application Ready");

        }

    }

    Omega.Application = new Application();

})(window);

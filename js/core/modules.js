/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/modules.js
 * Version: RC3.1.012
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class ModuleManager {

        constructor() {

            this.modules = {};

        }

        register(name, module) {

            this.modules[name] = module;

            Omega.Logger.success(name + " registered");

        }

        get(name) {

            return this.modules[name];

        }

        all() {

            return this.modules;

        }

    }

    Omega.Modules = new ModuleManager();

})(window);

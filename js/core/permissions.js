/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/permissions.js
 * Version: RC3.1.007
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class PermissionManager {

        constructor() {

            this.role = "guest";

        }

        setRole(role) {

            this.role = role;

        }

        has(required) {

            if (this.role === "owner") return true;

            return this.role === required;

        }

    }

    Omega.Permissions = new PermissionManager();

})(window);

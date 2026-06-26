/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/theme.js
 * Version: RC3.1.014
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Theme {

        constructor() {

            this.current = Omega.Storage.get("theme", "omega-dark");

            this.apply(this.current);

        }

        apply(theme) {

            document.documentElement.setAttribute("data-theme", theme);

            this.current = theme;

            Omega.Storage.set("theme", theme);

        }

        currentTheme() {

            return this.current;

        }

    }

    Omega.Theme = new Theme();

})(window);

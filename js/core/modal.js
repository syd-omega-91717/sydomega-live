/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/modal.js
 * Version: RC3.1.016
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Modal {

        open(id) {

            const modal = document.getElementById(id);

            if (modal) modal.style.display = "flex";

        }

        close(id) {

            const modal = document.getElementById(id);

            if (modal) modal.style.display = "none";

        }

    }

    Omega.Modal = new Modal();

})(window);

/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/storage.js
 * Version: RC3.1.005
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class StorageManager {

        constructor(prefix = "OMEGA") {
            this.prefix = prefix;
        }

        key(name) {
            return `${this.prefix}_${name}`;
        }

        set(name, value) {
            localStorage.setItem(
                this.key(name),
                JSON.stringify(value)
            );
        }

        get(name, fallback = null) {

            const value = localStorage.getItem(this.key(name));

            if (!value) return fallback;

            try {
                return JSON.parse(value);
            } catch {
                return fallback;
            }

        }

        remove(name) {
            localStorage.removeItem(this.key(name));
        }

        clear() {

            Object.keys(localStorage)
                .filter(k => k.startsWith(this.prefix + "_"))
                .forEach(k => localStorage.removeItem(k));

        }

    }

    Omega.Storage = new StorageManager();

})(window);

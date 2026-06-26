/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/events.js
 * Version: RC3.1.003
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class EventBus {

        constructor() {
            this.events = {};
        }

        on(event, callback) {

            if (!this.events[event]) {

                this.events[event] = [];

            }

            this.events[event].push(callback);

        }

        off(event, callback) {

            if (!this.events[event]) return;

            this.events[event] =
                this.events[event].filter(fn => fn !== callback);

        }

        emit(event, payload = {}) {

            if (!this.events[event]) return;

            this.events[event].forEach(callback => {

                callback(payload);

            });

        }

    }

    Omega.Events = new EventBus();

})(window);

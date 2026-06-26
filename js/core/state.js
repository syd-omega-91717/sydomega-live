/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/state.js
 * Version: RC3.1.004
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class StateManager {

        constructor() {

            this.state = {

                user: null,

                profile: null,

                notifications: [],

                wallet: null,

                academy: {},

                dashboard: {},

                theme: "omega-dark",

                language: "en"

            };

        }

        get(key) {

            return this.state[key];

        }

        set(key, value) {

            this.state[key] = value;

            Omega.Events.emit("state.changed", {

                key,

                value

            });

        }

        all() {

            return this.state;

        }

    }

    Omega.State = new StateManager();

})(window);

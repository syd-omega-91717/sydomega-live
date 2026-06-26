/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/auth.js
 * Version: RC3.1.010
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Auth {

        constructor() {
            this.user = null;
            this.session = null;
        }

        async initialize() {

            if (!window.supabase) {
                Omega.Logger.warning("Supabase not detected.");
                return;
            }

            const {
                data: { session }
            } = await window.supabase.auth.getSession();

            this.session = session;
            this.user = session ? session.user : null;

            Omega.State.set("user", this.user);

            Omega.Events.emit("auth.ready", {
                user: this.user
            });

        }

        isAuthenticated() {
            return this.user !== null;
        }

        getUser() {
            return this.user;
        }

        async logout() {

            if (!window.supabase) return;

            await window.supabase.auth.signOut();

            this.user = null;
            this.session = null;

            Omega.State.set("user", null);

            Omega.Events.emit("auth.logout");

            location.href = "login.html";

        }

    }

    Omega.Auth = new Auth();

})(window);

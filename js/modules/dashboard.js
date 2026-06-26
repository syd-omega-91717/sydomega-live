/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/modules/dashboard.js
 * Version: RC3.2.001
 * ==========================================================
 */

(function (window) {
    'use strict';

    window.Omega = window.Omega || {};

    class DashboardModule {

        constructor() {
            this.initialized = false;
        }

        async initialize() {

            if (this.initialized) return;

            Omega.Logger.info("Initializing Dashboard");

            await this.loadCurrentUser();
            await this.loadStatistics();
            await this.loadNotifications();

            this.bindEvents();

            this.initialized = true;

            Omega.Events.emit(
                Omega.Constants.EVENTS.DASHBOARD_LOADED
            );

            Omega.Logger.success("Dashboard Ready");
        }

        async loadCurrentUser() {

            const user = Omega.Auth.getUser();

            if (!user) return;

            Omega.State.set("user", user);

            const name =
                document.querySelector("[data-user-name]");

            if (name) {
                name.textContent =
                    user.user_metadata?.full_name ||
                    user.email ||
                    "Member";
            }

        }

        async loadStatistics() {

            const stats = {
                projects: 0,
                academy: 0,
                publications: 0,
                notifications: 0
            };

            Omega.State.set("dashboard", stats);

            document
                .querySelectorAll("[data-stat]")
                .forEach(element => {

                    const key = element.dataset.stat;

                    if (stats[key] !== undefined) {
                        element.textContent = stats[key];
                    }

                });

        }

        async loadNotifications() {

            Omega.State.set("notifications", []);

        }

        bindEvents() {

            document
                .querySelectorAll("[data-route]")
                .forEach(button => {

                    button.addEventListener("click", () => {

                        Omega.Router.go(
                            button.dataset.route
                        );

                    });

                });

        }

        refresh() {

            this.loadStatistics();

        }

    }

    Omega.Dashboard = new DashboardModule();

})(window);

/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/services/dashboard.service.js
 * Version: RC3.2.002
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};
    Omega.Services = Omega.Services || {};

    class DashboardService {

        async loadDashboard() {

            return {
                profile: await this.loadProfile(),
                statistics: await this.loadStatistics(),
                activity: await this.loadActivity(),
                notifications: await this.loadNotifications()
            };

        }

        async loadProfile() {

            const user = Omega.Auth.getUser();

            if (!user) return null;

            return {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || "",
                avatar: user.user_metadata?.avatar_url || "",
                verified: !!user.email_confirmed_at
            };

        }

        async loadStatistics() {

            return {
                projects: 0,
                academy: 0,
                consultancy: 0,
                publications: 0,
                aiSessions: 0,
                notifications: 0
            };

        }

        async loadActivity() {

            return [];

        }

        async loadNotifications() {

            return [];

        }

    }

    Omega.Services.Dashboard = new DashboardService();

})(window);

/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/constants.js
 * Version: RC3.1.018
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    Omega.Constants = Object.freeze({

        EVENTS: {

            APP_READY: "app.ready",

            LOGIN: "auth.login",

            LOGOUT: "auth.logout",

            PROFILE_UPDATED: "profile.updated",

            NOTIFICATION: "notification.new",

            DASHBOARD_LOADED: "dashboard.loaded",

            SEARCH_COMPLETED: "search.completed",

            COURSE_COMPLETED: "academy.completed"

        },

        ROLES: {

            GUEST: "guest",

            MEMBER: "member",

            VERIFIED: "verified",

            ADMIN: "admin",

            OWNER: "owner"

        }

    });

})(window);

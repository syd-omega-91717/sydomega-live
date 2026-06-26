/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * Platform Core Configuration
 * ==========================================================
 * File: js/core/config.js
 * Version: RC3.1.001
 * Status: Production
 * Author: Ω Development Team
 * ==========================================================
 */

(function (window) {
    'use strict';

    window.Omega = window.Omega || {};

    const Config = {

        SYSTEM: {
            NAME: "Ω SYD OMEGA 91717",
            SHORT_NAME: "SYD OMEGA",
            VERSION: "RC3.1.001",
            BUILD: "2026.1",
            ENVIRONMENT: "production",
            DOMAIN: "https://www.sydomega.com",
            COPYRIGHT: "© 2026 Ω SYD OMEGA"
        },

        API: {
            BASE_URL: "/api",
            TIMEOUT: 30000
        },

        SUPABASE: {
            URL: window.SUPABASE_URL || "",
            ANON_KEY: window.SUPABASE_ANON_KEY || ""
        },

        STORAGE: {
            AVATARS: "avatars",
            DOCUMENTS: "documents",
            PUBLICATIONS: "publications",
            MEDIA: "media"
        },

        FEATURES: {

            AUTH: true,

            DASHBOARD: true,

            PROFILE: true,

            SEARCH: true,

            AI: true,

            ACADEMY: true,

            CONSULTANCY: true,

            PUBLISHING: true,

            NOTIFICATIONS: true,

            WALLET: true,

            MARKETPLACE: true,

            HERITAGE: true,

            ANALYTICS: true

        },

        UI: {

            DEFAULT_THEME: "omega-dark",

            DEFAULT_LANGUAGE: "en",

            ITEMS_PER_PAGE: 20,

            MAX_UPLOAD_MB: 25,

            DATE_FORMAT: "YYYY-MM-DD"

        },

        SECURITY: {

            SESSION_TIMEOUT: 60,

            PASSWORD_MIN_LENGTH: 8,

            ENABLE_AUDIT_LOG: true

        },

        SOCIAL: {

            WEBSITE: "https://www.sydomega.com",

            REDDIT: "https://reddit.com/u/SYDOmega_91717",

            INSTAGRAM: "https://instagram.com/sydomega_91717",

            TIKTOK: "https://www.tiktok.com/@sydomega_",

            TELEGRAM: "https://t.me/SYDOmega",

            LINKEDIN: "https://www.linkedin.com/in/syd-omega-a472293b0"

        }

    };

    Object.freeze(Config);

    Omega.Config = Config;

})(window);

/**
 * ============================================================
 * Ω SYD OMEGA 91717
 * Core Configuration
 * ============================================================
 */

window.Omega = window.Omega || {};

Omega.Config = Object.freeze({

    APP_NAME: "Ω SYD OMEGA 91717",

    VERSION: "RC3.1",

    BUILD: "2026.06",

    ENVIRONMENT: "production",

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

        ACADEMY: true,

        AI: true,

        SEARCH: true,

        PUBLISHING: true,

        CONSULTANCY: true,

        NOTIFICATIONS: true,

        TREASURY: true,

        WALLET: true

    },

    PAGINATION: {

        DEFAULT_PAGE_SIZE: 20,

        MAX_PAGE_SIZE: 100

    },

    THEME: {

        DEFAULT: "omega-dark"

    }

});

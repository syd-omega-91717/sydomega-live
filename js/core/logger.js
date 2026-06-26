/**
 * ============================================================
 * Ω Logger
 * ============================================================
 */

window.Omega = window.Omega || {};

Omega.Logger = {

    info(message, data = null) {

        console.info("[Ω INFO]", message, data);

    },

    warn(message, data = null) {

        console.warn("[Ω WARNING]", message, data);

    },

    error(message, data = null) {

        console.error("[Ω ERROR]", message, data);

    },

    success(message, data = null) {

        console.log("[Ω SUCCESS]", message, data);

    }

};

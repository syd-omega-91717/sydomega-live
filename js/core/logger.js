/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/logger.js
 * Version: RC3.1.002
 * ==========================================================
 */

(function (window) {
    'use strict';

    window.Omega = window.Omega || {};

    class Logger {

        constructor() {
            this.enabled = true;
            this.history = [];
        }

        write(level, message, data = null) {

            if (!this.enabled) return;

            const log = {
                timestamp: new Date().toISOString(),
                level,
                message,
                data
            };

            this.history.push(log);

            switch (level) {

                case "INFO":
                    console.info("[Ω]", message, data);
                    break;

                case "SUCCESS":
                    console.log("%c[Ω SUCCESS]", "color:green", message, data);
                    break;

                case "WARNING":
                    console.warn("[Ω WARNING]", message, data);
                    break;

                case "ERROR":
                    console.error("[Ω ERROR]", message, data);
                    break;

                default:
                    console.log("[Ω]", message, data);

            }

        }

        info(message, data = null) {
            this.write("INFO", message, data);
        }

        success(message, data = null) {
            this.write("SUCCESS", message, data);
        }

        warning(message, data = null) {
            this.write("WARNING", message, data);
        }

        error(message, data = null) {
            this.write("ERROR", message, data);
        }

        getHistory() {
            return [...this.history];
        }

        clear() {
            this.history = [];
        }

    }

    Omega.Logger = new Logger();

})(window);

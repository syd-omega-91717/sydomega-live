/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/api.js
 * Version: RC3.1.006
 * ==========================================================
 */

(function (window) {

    'use strict';

    window.Omega = window.Omega || {};

    class Api {

        constructor() {
            this.baseUrl = Omega.Config.API.BASE_URL;
            this.timeout = Omega.Config.API.TIMEOUT;
        }

        async request(endpoint, options = {}) {

            const controller = new AbortController();

            const timeout = setTimeout(() => {
                controller.abort();
            }, this.timeout);

            try {

                const response = await fetch(
                    this.baseUrl + endpoint,
                    {
                        ...options,
                        signal: controller.signal,
                        headers: {
                            "Content-Type": "application/json",
                            ...(options.headers || {})
                        }
                    }
                );

                clearTimeout(timeout);

                return await response.json();

            } catch (error) {

                Omega.Logger.error(error.message);

                throw error;

            }

        }

        get(endpoint) {
            return this.request(endpoint);
        }

        post(endpoint, body) {

            return this.request(endpoint, {

                method: "POST",

                body: JSON.stringify(body)

            });

        }

        put(endpoint, body) {

            return this.request(endpoint, {

                method: "PUT",

                body: JSON.stringify(body)

            });

        }

        delete(endpoint) {

            return this.request(endpoint, {

                method: "DELETE"

            });

        }

    }

    Omega.Api = new Api();

})(window);

/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/health.js
 * Version: RC3.1.023
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};

class Health{

    async check(){

        return{

            status:"healthy",

            version:Omega.Config.SYSTEM.VERSION,

            online:navigator.onLine,

            timestamp:new Date().toISOString()

        };

    }

}

Omega.Health=new Health();

})(window);

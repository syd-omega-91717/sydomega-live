/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/helpers.js
 * Version: RC3.1.019
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};

Omega.Helpers = {

    uuid(){

        return crypto.randomUUID();

    },

    timestamp(){

        return new Date().toISOString();

    },

    delay(ms){

        return new Promise(resolve=>setTimeout(resolve,ms));

    },

    capitalize(text){

        if(!text) return "";

        return text.charAt(0).toUpperCase()+text.slice(1);

    },

    currency(value){

        return Number(value).toLocaleString();

    },

    percent(value){

        return value + "%";

    }

};

})(window);

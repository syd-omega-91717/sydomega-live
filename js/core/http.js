/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/http.js
 * Version: RC3.1.020
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};

class Http{

    async get(url){

        return fetch(url).then(r=>r.json());

    }

    async post(url,data){

        return fetch(url,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(data)
        }).then(r=>r.json());

    }

}

Omega.Http = new Http();

})(window);

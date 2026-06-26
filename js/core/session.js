/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/session.js
 * Version: RC3.1.021
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};

class Session{

    start(user){

        Omega.Storage.set("session",user);

    }

    current(){

        return Omega.Storage.get("session");

    }

    destroy(){

        Omega.Storage.remove("session");

    }

}

Omega.Session = new Session();

})(window);

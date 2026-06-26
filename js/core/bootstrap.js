/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/bootstrap.js
 * Version: RC3.1.024
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};

document.addEventListener("DOMContentLoaded",async()=>{

    Omega.Logger.info("Starting Ω Platform");

    await Omega.Auth.initialize();

    Omega.Theme.apply(
        Omega.Storage.get("theme","omega-dark")
    );

    Omega.Events.emit(
        Omega.Constants.EVENTS.APP_READY
    );

    Omega.Logger.success("Ω Platform Ready");

});

})(window);

/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/modules/analytics.js
 * Version: RC3.2.021
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};

class Analytics{

    initialize(){

        Omega.Services.Analytics.track("application_started");

        window.addEventListener("click",()=>{

            Omega.Services.Analytics.track("click");

        });

    }

}

Omega.Analytics=new Analytics();

})(window);

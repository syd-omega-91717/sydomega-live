/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/services/analytics.service.js
 * Version: RC3.2.020
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};
Omega.Services=Omega.Services||{};

class AnalyticsService{

    constructor(){

        this.events=[];

    }

    track(event,data={}){

        this.events.push({

            id:crypto.randomUUID(),

            event,

            data,

            timestamp:new Date().toISOString()

        });

    }

    all(){

        return this.events;

    }

    clear(){

        this.events=[];

    }

}

Omega.Services.Analytics=new AnalyticsService();

})(window);

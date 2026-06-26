/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/services/publishing.service.js
 * Version: RC3.2.014
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};
Omega.Services=Omega.Services||{};

class PublishingService{

    constructor(){

        this.items=[];

    }

    async all(){

        return this.items;

    }

    async publish(data){

        this.items.unshift(data);

        Omega.Logger.success("Publication Created");

    }

}

Omega.Services.Publishing=
new PublishingService();

})(window);

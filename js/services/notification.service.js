/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/services/notification.service.js
 * Version: RC3.2.009
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};
Omega.Services = Omega.Services || {};

class NotificationService{

    constructor(){

        this.notifications=[];

    }

    all(){

        return this.notifications;

    }

    add(title,message){

        this.notifications.unshift({

            id:crypto.randomUUID(),

            title,

            message,

            created:new Date().toISOString(),

            read:false

        });

    }

    markRead(id){

        const n=this.notifications.find(x=>x.id===id);

        if(n) n.read=true;

    }

}

Omega.Services.Notifications=
new NotificationService();

})(window);

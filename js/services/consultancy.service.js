/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/services/consultancy.service.js
 * Version: RC3.2.016
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};
Omega.Services = Omega.Services || {};

class ConsultancyService{

    constructor(){

        this.sessions=[];

    }

    async getAll(){

        return this.sessions;

    }

    async create(session){

        session.id = crypto.randomUUID();
        session.createdAt = new Date().toISOString();

        this.sessions.unshift(session);

        Omega.Logger.success("Consultancy Session Created");

        return session;

    }

    async cancel(id){

        this.sessions=this.sessions.filter(x=>x.id!==id);

    }

}

Omega.Services.Consultancy=new ConsultancyService();

})(window);

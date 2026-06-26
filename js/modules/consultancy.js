/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/modules/consultancy.js
 * Version: RC3.2.017
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};

class Consultancy{

    async initialize(){

        const sessions=
        await Omega.Services.Consultancy.getAll();

        this.render(sessions);

    }

    render(list){

        const container=
        document.querySelector("[data-consultancy]");

        if(!container) return;

        container.innerHTML=list.map(item=>`

        <div class="omega-card">

            <h3>${item.title}</h3>

            <p>${item.client}</p>

            <small>${item.createdAt}</small>

        </div>

        `).join("");

    }

}

Omega.Consultancy=new Consultancy();

})(window);

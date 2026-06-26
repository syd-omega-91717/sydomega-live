/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/modules/publishing.js
 * Version: RC3.2.015
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};

class Publishing{

    async initialize(){

        const publications=

        await Omega.Services.Publishing.all();

        this.render(publications);

    }

    render(items){

        const container=

        document.querySelector("[data-publications]");

        if(!container) return;

        container.innerHTML=

        items.map(item=>`

        <div class="omega-card">

            <h3>${item.title}</h3>

            <p>${item.description}</p>

        </div>

        `).join("");

    }

}

Omega.Publishing=new Publishing();

})(window);

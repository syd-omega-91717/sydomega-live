/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/components/sidebar.js
 * Version: RC3.2.003
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};
Omega.Components = Omega.Components || {};

class Sidebar{

    constructor(){

        this.items=[
            {title:"Dashboard",page:"dashboard.html"},
            {title:"Profile",page:"profile.html"},
            {title:"Academy",page:"academy.html"},
            {title:"AI",page:"chatbot.html"},
            {title:"Search",page:"search.html"},
            {title:"Publishing",page:"publishing.html"},
            {title:"Consultancy",page:"consultancy.html"},
            {title:"Settings",page:"settings.html"}
        ];

    }

    render(selector){

        const container=document.querySelector(selector);

        if(!container) return;

        container.innerHTML=this.items.map(item=>`

            <a class="omega-sidebar-item"
               href="${item.page}">
               ${item.title}
            </a>

        `).join("");

    }

}

Omega.Components.Sidebar=new Sidebar();

})(window);

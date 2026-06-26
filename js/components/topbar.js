/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/components/topbar.js
 * Version: RC3.2.004
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};
Omega.Components = Omega.Components || {};

class Topbar{

    render(selector){

        const container=document.querySelector(selector);

        if(!container) return;

        const user=Omega.Auth.getUser();

        container.innerHTML=`

        <div class="omega-topbar">

            <div class="omega-logo">

                Ω SYD OMEGA

            </div>

            <div class="omega-user">

                ${user?.email || "Guest"}

            </div>

        </div>

        `;

    }

}

Omega.Components.Topbar=new Topbar();

})(window);

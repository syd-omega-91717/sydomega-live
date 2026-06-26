/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/modules/profile.js
 * Version: RC3.2.006
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};

class ProfileModule{

    async initialize(){

        const profile=
        await Omega.Services.Profile.load();

        if(!profile) return;

        this.render(profile);

    }

    render(profile){

        document
        .querySelectorAll("[data-profile]")
        .forEach(element=>{

            const key=
            element.dataset.profile;

            if(profile[key]!==undefined){

                if(element.tagName==="INPUT"){

                    element.value=profile[key];

                }else{

                    element.textContent=profile[key];

                }

            }

        });

    }

}

Omega.Profile=new ProfileModule();

})(window);

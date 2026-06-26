/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/modules/chatbot.js
 * Version: RC3.2.013
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};

class Chatbot{

    async send(){

        const input=
        document.querySelector("[data-ai-input]");

        if(!input) return;

        const response=

        await Omega.Services.AI.send(

            input.value

        );

        const output=

        document.querySelector("[data-ai-output]");

        if(output){

            output.innerHTML=

            response.response;

        }

    }

}

Omega.Chatbot=new Chatbot();

})(window);

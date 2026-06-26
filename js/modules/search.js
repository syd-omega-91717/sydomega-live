/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/modules/search.js
 * Version: RC3.2.008
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};

class SearchModule{

    constructor(){

        this.input=null;
        this.results=null;

    }

    initialize(inputSelector,resultSelector){

        this.input=document.querySelector(inputSelector);

        this.results=document.querySelector(resultSelector);

        if(!this.input) return;

        this.input.addEventListener("input",

        async()=>{

            const list=

            await Omega.Services.Search.search(

                this.input.value

            );

            this.render(list);

        });

    }

    render(list){

        if(!this.results) return;

        this.results.innerHTML=list.map(item=>`

        <div class="omega-search-item">

            ${item}

        </div>

        `).join("");

    }

}

Omega.Search=new SearchModule();

})(window);

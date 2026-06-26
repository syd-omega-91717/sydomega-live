/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/modules/wallet.js
 * Version: RC3.2.019
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};

class Wallet{

    async initialize(){

        const wallet=

        await Omega.Services.Wallet.load();

        this.render(wallet);

    }

    render(wallet){

        document
        .querySelectorAll("[data-wallet]")
        .forEach(item=>{

            const key=item.dataset.wallet;

            if(wallet[key]!==undefined){

                item.textContent=wallet[key];

            }

        });

    }

}

Omega.Wallet=new Wallet();

})(window);

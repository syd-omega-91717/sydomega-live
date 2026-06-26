/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/services/wallet.service.js
 * Version: RC3.2.018
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};
Omega.Services=Omega.Services||{};

class WalletService{

    constructor(){

        this.wallet={

            balance:0,

            income:0,

            expenses:0,

            currency:"USD"

        };

    }

    async load(){

        return this.wallet;

    }

    async deposit(amount){

        amount=Number(amount);

        this.wallet.balance+=amount;
        this.wallet.income+=amount;

    }

    async withdraw(amount){

        amount=Number(amount);

        this.wallet.balance-=amount;
        this.wallet.expenses+=amount;

    }

}

Omega.Services.Wallet=new WalletService();

})(window);

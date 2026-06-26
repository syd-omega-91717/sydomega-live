/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/core/cache.js
 * Version: RC3.1.022
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};

class Cache{

    constructor(){

        this.cache={};

    }

    set(key,value){

        this.cache[key]=value;

    }

    get(key){

        return this.cache[key];

    }

    remove(key){

        delete this.cache[key];

    }

    clear(){

        this.cache={};

    }

}

Omega.Cache = new Cache();

})(window);

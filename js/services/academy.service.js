/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/services/academy.service.js
 * Version: RC3.2.010
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};
Omega.Services=Omega.Services||{};

class AcademyService{

    constructor(){

        this.courses=[];

    }

    async load(){

        return this.courses;

    }

    async enroll(courseId){

        Omega.Logger.success("Enrolled",courseId);

    }

    async complete(courseId){

        Omega.Logger.success("Completed",courseId);

    }

}

Omega.Services.Academy=new AcademyService();

})(window);

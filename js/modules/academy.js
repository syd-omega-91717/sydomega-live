/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/modules/academy.js
 * Version: RC3.2.011
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega=window.Omega||{};

class Academy{

    async initialize(){

        const courses=
        await Omega.Services.Academy.load();

        this.render(courses);

    }

    render(courses){

        const container=
        document.querySelector("[data-academy]");

        if(!container) return;

        container.innerHTML=courses.map(course=>`

        <div class="omega-card">

            <h3>${course.title}</h3>

            <p>${course.description}</p>

        </div>

        `).join("");

    }

}

Omega.Academy=new Academy();

})(window);

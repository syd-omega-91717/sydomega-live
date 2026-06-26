/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/services/search.service.js
 * Version: RC3.2.007
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};
Omega.Services = Omega.Services || {};

class SearchService{

    async search(query){

        query=query.toLowerCase();

        const modules=[

            "Dashboard",
            "Profile",
            "Academy",
            "Publishing",
            "Consultancy",
            "AI Assistant",
            "Notifications",
            "Settings"

        ];

        return modules.filter(item=>

            item.toLowerCase().includes(query)

        );

    }

}

Omega.Services.Search=
new SearchService();

})(window);

/**
 * ==========================================================
 * Ω SYD OMEGA 91717
 * File: js/services/profile.service.js
 * Version: RC3.2.005
 * ==========================================================
 */

(function(window){

'use strict';

window.Omega = window.Omega || {};
Omega.Services = Omega.Services || {};

class ProfileService{

    async load(){

        const user = Omega.Auth.getUser();

        if(!user) return null;

        return {

            id:user.id,
            email:user.email,
            name:user.user_metadata?.full_name || "",
            avatar:user.user_metadata?.avatar_url || "",
            phone:user.user_metadata?.phone || "",
            website:user.user_metadata?.website || "",
            company:user.user_metadata?.company || "",
            bio:user.user_metadata?.bio || "",
            verified:!!user.email_confirmed_at

        };

    }

    async update(data){

        if(!window.supabase)
            throw new Error("Supabase not initialized");

        return await window.supabase.auth.updateUser({

            data:data

        });

    }

}

Omega.Services.Profile=new ProfileService();

})(window);

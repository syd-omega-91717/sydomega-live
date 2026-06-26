import { supabase } from "../database/supabase";

export async function register(email: string, password: string) {

    const { data, error } = await supabase.auth.admin.createUser({

        email,

        password,

        email_confirm: true

    });

    if (error) throw error;

    return data.user;

}

export async function login(email: string, password: string) {

    const { data, error } = await supabase.auth.signInWithPassword({

        email,

        password

    });

    if (error) throw error;

    return data;

}

export async function refresh(refreshToken: string) {

    const { data, error } = await supabase.auth.refreshSession({

        refresh_token: refreshToken

    });

    if (error) throw error;

    return data;

}

export async function logout(jwt: string) {

    const client = supabase.auth;

    client.setSession({

        access_token: jwt,

        refresh_token: ""

    });

    await client.signOut();

}

export async function profile(jwt: string) {

    await supabase.auth.setSession({

        access_token: jwt,

        refresh_token: ""

    });

    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    return data.user;

}

export async function resetPassword(email: string) {

    const { data, error } =

        await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;

    return data;

}

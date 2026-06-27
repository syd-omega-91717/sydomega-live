// ============================================================================
// FILE: /backend/src/services/search.service.js
// NEW FILE
// ============================================================================

import {supabase} from "../database/supabase.js";

export async function globalSearch(query){

    const [

        publications,

        courses,

        marketplace,

        organizations

    ]=await Promise.all([

        supabase

        .from("publications")

        .select("*")

        .ilike("title",`%${query}%`),

        supabase

        .from("academy_courses")

        .select("*")

        .ilike("title",`%${query}%`),

        supabase

        .from("marketplace_listings")

        .select("*")

        .ilike("title",`%${query}%`),

        supabase

        .from("organizations")

        .select("*")

        .ilike("name",`%${query}%`)

    ]);

    return{

        publications:publications.data||[],

        academy:courses.data||[],

        marketplace:marketplace.data||[],

        organizations:organizations.data||[]

    };

}

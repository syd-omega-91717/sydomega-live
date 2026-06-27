// ============================================================================
// FILE: /backend/src/services/storage.service.js
// NEW FILE
// ============================================================================

import {supabase} from "../database/supabase.js";

export async function upload(bucket,path,file){

    const {data,error}=await supabase.storage

        .from(bucket)

        .upload(path,file,{

            upsert:true

        });

    if(error) throw error;

    return data;

}

export async function remove(bucket,path){

    const {error}=await supabase.storage

        .from(bucket)

        .remove([path]);

    if(error) throw error;

    return true;

}

export async function publicUrl(bucket,path){

    const {data}=supabase.storage

        .from(bucket)

        .getPublicUrl(path);

    return data.publicUrl;

}

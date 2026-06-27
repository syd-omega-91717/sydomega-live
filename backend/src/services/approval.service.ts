import {supabase} from "../database/supabase";
import * as Notify from "./notification.service";

export async function pending(){

    const {data,error}=await supabase

        .from("approval_requests")

        .select("*,profiles(*)")

        .eq("current_status","pending")

        .order("created_at",{ascending:false});

    if(error) throw error;

    return data;

}

export async function approve(requestId:string,founder:string){

    const {data:request}=await supabase

        .from("approval_requests")

        .select("*")

        .eq("id",requestId)

        .single();

    if(!request) throw new Error("Request not found");

    await supabase

        .from("profiles")

        .update({

            approval_status:"approved",

            account_enabled:true,

            verification_status:"verified",

            approved_by:founder,

            approved_at:new Date()

        })

        .eq("id",request.profile_id);

    await supabase

        .from("approval_requests")

        .update({

            current_status:"approved",

            reviewed_by:founder,

            reviewed_at:new Date()

        })

        .eq("id",requestId);

    await Notify.createNotification({

        approval_request_id:requestId,

        recipient:request.profile_id,

        sender:founder,

        title:"Account Approved",

        body:"Your account has been approved.",

        action_url:"/dashboard"

    });

}

export async function reject(requestId:string,founder:string,reason:string){

    const {data:request}=await supabase

        .from("approval_requests")

        .select("*")

        .eq("id",requestId)

        .single();

    if(!request) throw new Error("Request not found");

    await supabase

        .from("profiles")

        .update({

            approval_status:"rejected",

            account_enabled:false,

            rejection_reason:reason

        })

        .eq("id",request.profile_id);

    await supabase

        .from("approval_requests")

        .update({

            current_status:"rejected",

            rejection_reason:reason,

            reviewed_by:founder,

            reviewed_at:new Date()

        })

        .eq("id",requestId);

    await Notify.createNotification({

        approval_request_id:requestId,

        recipient:request.profile_id,

        sender:founder,

        title:"Account Rejected",

        body:reason,

        action_url:"/login"

    });

}

// ============================================================================
// FILE: /backend/src/services/academyApproval.service.js
// REPLACE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function pendingCourses(){

    const {data}=await supabase

    .from("academy_courses")

    .select("*")

    .eq("status","pending");

    return data||[];

}

export async function approve(courseId,founderId){

    const {data}=await supabase

    .from("academy_courses")

    .update({

        status:"published",

        approved_by:founderId,

        approved_at:new Date()

    })

    .eq("id",courseId)

    .select()

    .single();

    await Events.publish(

        founderId,

        null,

        "academy",

        "course_published",

        data

    );

    return data;

}

export async function reject(courseId,reason){

    return supabase

    .from("academy_courses")

    .update({

        status:"rejected",

        rejection_reason:reason

    })

    .eq("id",courseId);

}

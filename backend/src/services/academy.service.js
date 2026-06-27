// ============================================================================
// FILE: /backend/src/services/academy.service.js
// REPLACE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Events from "./event.service.js";

export async function dashboard(userId){

    const [

        enrollments,
        progress,
        certificates,
        courses,
        exams

    ]=await Promise.all([

        supabase
        .from("academy_enrollments")
        .select("*,academy_courses(*)")
        .eq("user_id",userId),

        supabase
        .from("academy_progress")
        .select("*")
        .eq("user_id",userId),

        supabase
        .from("certificates")
        .select("*")
        .eq("user_id",userId),

        supabase
        .from("academy_courses")
        .select("*")
        .eq("published",true),

        supabase
        .from("academy_exam_results")
        .select("*")
        .eq("user_id",userId)

    ]);

    return{

        courses:courses.data||[],
        enrollments:enrollments.data||[],
        progress:progress.data||[],
        certificates:certificates.data||[],
        exams:exams.data||[]

    };

}

export async function enroll(userId,courseId){

    const {data,error}=await supabase

    .from("academy_enrollments")

    .insert({

        user_id:userId,

        course_id:courseId

    })

    .select()

    .single();

    if(error) throw error;

    await Events.publish(

        userId,

        userId,

        "academy",

        "course_enrolled",

        {

            course_id:courseId

        }

    );

    return data;

}

export async function completeLesson(userId,lessonId){

    await supabase

    .from("lesson_completions")

    .insert({

        user_id:userId,

        lesson:lessonId

    });

    await Events.publish(

        userId,

        userId,

        "academy",

        "lesson_completed",

        {

            lesson_id:lessonId

        }

    );

}

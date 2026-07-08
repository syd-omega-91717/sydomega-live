// ============================================================================
// FILE:
// /core/academy/LessonEngine.ts
// ============================================================================

import { AcademyLesson } from "./AcademyLesson";

export class LessonEngine{

    complete(

        lesson:AcademyLesson

    ){

        return{

            lessonId:lesson.id,

            completed:true,

            completedAt:Date.now()

        };

    }

}

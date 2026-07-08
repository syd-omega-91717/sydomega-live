// ============================================================================
// FILE:
// /core/academy/AcademyCurriculum.ts
// ============================================================================

import { AcademyCourse } from "./AcademyCourse";

export class AcademyCurriculum{

    private readonly courses:AcademyCourse[]=[];

    add(

        course:AcademyCourse

    ){

        this.courses.push(course);

    }

    all(){

        return this.courses;

    }

}

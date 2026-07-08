// ============================================================================
// FILE:
// /enterprise/education/LearningManagementEngine.ts
// ============================================================================

import { Course } from "./Course";

export class LearningManagementEngine{

    private readonly courses=

    new Map<string,Course>();

    publish(

        course:Course

    ){

        course.published=true;

        this.courses.set(course.id,course);

    }

    list(){

        return [...this.courses.values()];

    }

}

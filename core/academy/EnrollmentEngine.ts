// ============================================================================
// FILE:
// /core/academy/EnrollmentEngine.ts
// ============================================================================

import { AcademyEnrollment } from "./AcademyEnrollment";

export class EnrollmentEngine{

    enroll(

        enrollment:AcademyEnrollment

    ){

        enrollment.enrolledAt=

        Date.now();

        return enrollment;

    }

}

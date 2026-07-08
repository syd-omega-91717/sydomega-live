// ============================================================================
// FILE:
// /core/academy/AcademyRuntime.ts
// ============================================================================

import { AcademyCurriculum } from "./AcademyCurriculum";
import { LearningPathEngine } from "./LearningPathEngine";
import { EnrollmentEngine } from "./EnrollmentEngine";
import { LessonEngine } from "./LessonEngine";
import { QuizEngine } from "./QuizEngine";
import { AssignmentEngine } from "./AssignmentEngine";
import { ExaminationEngine } from "./ExaminationEngine";
import { AcademyCertificateEngine } from "./AcademyCertificateEngine";
import { AcademySubscriptionEngine } from "./AcademySubscriptionEngine";
import { AcademyWalletEngine } from "./AcademyWalletEngine";
import { InstructorEngine } from "./InstructorEngine";

export class AcademyRuntime{

    readonly curriculum=

    new AcademyCurriculum();

    readonly learningPaths=

    new LearningPathEngine();

    readonly enrollment=

    new EnrollmentEngine();

    readonly lessons=

    new LessonEngine();

    readonly quizzes=

    new QuizEngine();

    readonly assignments=

    new AssignmentEngine();

    readonly examinations=

    new ExaminationEngine();

    readonly instructors=

    new InstructorEngine();

    readonly certificates=

    new AcademyCertificateEngine();

    readonly subscriptions=

    new AcademySubscriptionEngine();

    readonly wallet=

    new AcademyWalletEngine();

}

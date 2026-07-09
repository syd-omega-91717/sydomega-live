// ============================================================================
// FILE:
// /enterprise/education/EducationResearchOperationsOrchestrator.ts
// ============================================================================

import { AcademicAnalyticsEngine } from "./AcademicAnalyticsEngine";
import { AcademyManagementEngine } from "./AcademyManagementEngine";
import { AssessmentEngine } from "./AssessmentEngine";
import { CertificationEngine } from "./CertificationEngine";
import { CurriculumBuilderEngine } from "./CurriculumBuilderEngine";
import { DigitalLibraryEngine } from "./DigitalLibraryEngine";
import { KnowledgeRepositoryEngine } from "./KnowledgeRepositoryEngine";
import { LearningManagementEngine } from "./LearningManagementEngine";
import { ResearchManagementEngine } from "./ResearchManagementEngine";

export class EducationResearchOperationsOrchestrator{

    readonly lms=new LearningManagementEngine();

    readonly academy=new AcademyManagementEngine();

    readonly certification=new CertificationEngine();

    readonly library=new DigitalLibraryEngine();

    readonly research=new ResearchManagementEngine();

    readonly knowledge=new KnowledgeRepositoryEngine();

    readonly curriculum=new CurriculumBuilderEngine();

    readonly assessment=new AssessmentEngine();

    readonly analytics=new AcademicAnalyticsEngine();

}

// ============================================================================
// FILE:
// /enterprise/education/SovereignAcademyOrchestrator.ts
// ============================================================================

import { AcademicAnalyticsEngine } from "./AcademicAnalyticsEngine";
import { AdaptiveLearningEngine } from "./AdaptiveLearningEngine";
import { AssessmentEngine } from "./AssessmentEngine";
import { CertificationEngine } from "./CertificationEngine";
import { DigitalCredentialEngine } from "./DigitalCredentialEngine";
import { KnowledgeDiscoveryEngine } from "./KnowledgeDiscoveryEngine";
import { LearningManagementEngine } from "./LearningManagementEngine";
import { ResearchRepository } from "./ResearchRepository";

export class SovereignAcademyOrchestrator{

    readonly lms=

    new LearningManagementEngine();

    readonly assessments=

    new AssessmentEngine();

    readonly certifications=

    new CertificationEngine();

    readonly credentials=

    new DigitalCredentialEngine();

    readonly research=

    new ResearchRepository();

    readonly discovery=

    new KnowledgeDiscoveryEngine();

    readonly adaptive=

    new AdaptiveLearningEngine();

    readonly analytics=

    new AcademicAnalyticsEngine();

}

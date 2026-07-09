// ============================================================================
// FILE:
// /enterprise/communications/CommunicationsOperationsOrchestrator.ts
// ============================================================================

import { CollaborationEngine } from "./CollaborationEngine";
import { EmailServicesEngine } from "./EmailServicesEngine";
import { EnterpriseMessagingEngine } from "./EnterpriseMessagingEngine";
import { EnterpriseSocialEngine } from "./EnterpriseSocialEngine";
import { KnowledgeManagementEngine } from "./KnowledgeManagementEngine";
import { NotificationHubEngine } from "./NotificationHubEngine";
import { VideoConferenceEngine } from "./VideoConferenceEngine";
import { VoIPEngine } from "./VoIPEngine";
import { WikiDocumentationEngine } from "./WikiDocumentationEngine";

export class CommunicationsOperationsOrchestrator{

    readonly messaging=new EnterpriseMessagingEngine();

    readonly email=new EmailServicesEngine();

    readonly voip=new VoIPEngine();

    readonly conferencing=new VideoConferenceEngine();

    readonly collaboration=new CollaborationEngine();

    readonly social=new EnterpriseSocialEngine();

    readonly knowledge=new KnowledgeManagementEngine();

    readonly wiki=new WikiDocumentationEngine();

    readonly notifications=new NotificationHubEngine();

}

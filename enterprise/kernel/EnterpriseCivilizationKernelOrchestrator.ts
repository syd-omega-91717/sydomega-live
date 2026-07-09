// ============================================================================
// FILE:
// /enterprise/kernel/EnterpriseCivilizationKernelOrchestrator.ts
// ============================================================================

import { CrossDomainWorkflowCoordinator } from "./CrossDomainWorkflowCoordinator";
import { EnterpriseCommandCenterEngine } from "./EnterpriseCommandCenterEngine";
import { EnterpriseServiceRegistryEngine } from "./EnterpriseServiceRegistryEngine";
import { GlobalConfigurationEngine } from "./GlobalConfigurationEngine";
import { GlobalSchedulerEngine } from "./GlobalSchedulerEngine";
import { PlatformCapabilityRegistryEngine } from "./PlatformCapabilityRegistryEngine";
import { SystemLifecycleManagerEngine } from "./SystemLifecycleManagerEngine";
import { UnifiedEventBusEngine } from "./UnifiedEventBusEngine";
import { UnifiedPolicyEngine } from "./UnifiedPolicyEngine";

export class EnterpriseCivilizationKernelOrchestrator{

    readonly registry=new EnterpriseServiceRegistryEngine();

    readonly configuration=new GlobalConfigurationEngine();

    readonly events=new UnifiedEventBusEngine();

    readonly command=new EnterpriseCommandCenterEngine();

    readonly workflows=new CrossDomainWorkflowCoordinator();

    readonly scheduler=new GlobalSchedulerEngine();

    readonly policy=new UnifiedPolicyEngine();

    readonly capabilities=new PlatformCapabilityRegistryEngine();

    readonly lifecycle=new SystemLifecycleManagerEngine();

}

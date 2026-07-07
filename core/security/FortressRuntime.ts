// ============================================================================
// FILE:
// /core/security/FortressRuntime.ts
// ============================================================================

import { CyberDefenseShield } from "./CyberDefenseShield";
import { TrafficProtectionShield } from "./TrafficProtectionShield";
import { DatabaseIntegrityShield } from "./DatabaseIntegrityShield";
import { ThreatDetectionShield } from "./ThreatDetectionShield";
import { ConfigurationValidationShield } from "./ConfigurationValidationShield";
import { RecoveryEngine } from "./RecoveryEngine";
import { ProtectedAccountManager } from "./ProtectedAccountManager";
import { IsolationLayer } from "./IsolationLayer";
import { IntegrityVerificationEngine } from "./IntegrityVerificationEngine";

export class FortressRuntime{

    readonly cyber=

    new CyberDefenseShield();

    readonly traffic=

    new TrafficProtectionShield();

    readonly database=

    new DatabaseIntegrityShield();

    readonly threat=

    new ThreatDetectionShield();

    readonly configuration=

    new ConfigurationValidationShield();

    readonly recovery=

    new RecoveryEngine();

    readonly protectedAccounts=

    new ProtectedAccountManager();

    readonly isolation=

    new IsolationLayer();

    readonly integrity=

    new IntegrityVerificationEngine();

}

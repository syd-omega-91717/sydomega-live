// ============================================================================
// FILE:
// /core/identity/IdentityRuntime.ts
// ============================================================================

import { ABACEngine } from "./ABACEngine";
import { AuditEngine } from "./AuditEngine";
import { BiometricEngine } from "./BiometricEngine";
import { CredentialEngine } from "./CredentialEngine";
import { DeviceTrustEngine } from "./DeviceTrustEngine";
import { DIDEngine } from "./DIDEngine";
import { KYCEngine } from "./KYCEngine";
import { MFAEngine } from "./MFAEngine";
import { OAuthEngine } from "./OAuthEngine";
import { PasskeyEngine } from "./PasskeyEngine";
import { RBACEngine } from "./RBACEngine";
import { SessionEngine } from "./SessionEngine";

export class IdentityRuntime{

    readonly did=new DIDEngine();

    readonly oauth=new OAuthEngine();

    readonly rbac=new RBACEngine();

    readonly abac=new ABACEngine();

    readonly mfa=new MFAEngine();

    readonly passkeys=new PasskeyEngine();

    readonly kyc=new KYCEngine();

    readonly biometrics=new BiometricEngine();

    readonly sessions=new SessionEngine();

    readonly devices=new DeviceTrustEngine();

    readonly credentials=new CredentialEngine();

    readonly audit=new AuditEngine();

}

// ============================================================================
// FILE:
// /enterprise/identity/IdentityTrustOperationsOrchestrator.ts
// ============================================================================

import { BiometricIdentityEngine } from "./BiometricIdentityEngine";
import { CertificateAuthorityEngine } from "./CertificateAuthorityEngine";
import { DecentralizedIdentifierEngine } from "./DecentralizedIdentifierEngine";
import { IdentityFederationEngine } from "./IdentityFederationEngine";
import { IdentityLifecycleEngine } from "./IdentityLifecycleEngine";
import { PrivacyConsentEngine } from "./PrivacyConsentEngine";
import { SovereignIdentityEngine } from "./SovereignIdentityEngine";
import { VerifiableCredentialEngine } from "./VerifiableCredentialEngine";
import { ZeroTrustIdentityEngine } from "./ZeroTrustIdentityEngine";

export class IdentityTrustOperationsOrchestrator{

    readonly sovereign=new SovereignIdentityEngine();

    readonly did=new DecentralizedIdentifierEngine();

    readonly credentials=new VerifiableCredentialEngine();

    readonly federation=new IdentityFederationEngine();

    readonly ca=new CertificateAuthorityEngine();

    readonly biometrics=new BiometricIdentityEngine();

    readonly privacy=new PrivacyConsentEngine();

    readonly zeroTrust=new ZeroTrustIdentityEngine();

    readonly lifecycle=new IdentityLifecycleEngine();

}

// ============================================================================
// FILE:
// /enterprise/quantum/QuantumOrchestrator.ts
// ============================================================================

import { HybridCryptographyEngine } from "./HybridCryptographyEngine";
import { LatticeSignatureEngine } from "./LatticeSignatureEngine";
import { PostQuantumCryptographyEngine } from "./PostQuantumCryptographyEngine";
import { PostQuantumKeyManager } from "./PostQuantumKeyManager";
import { QuantumOptimizationEngine } from "./QuantumOptimizationEngine";
import { QuantumRandomEngine } from "./QuantumRandomEngine";
import { QuantumSecurityEngine } from "./QuantumSecurityEngine";
import { QuantumSimulatorEngine } from "./QuantumSimulatorEngine";

export class QuantumOrchestrator{

    readonly pqc=

    new PostQuantumCryptographyEngine();

    readonly keys=

    new PostQuantumKeyManager();

    readonly simulator=

    new QuantumSimulatorEngine();

    readonly optimization=

    new QuantumOptimizationEngine();

    readonly random=

    new QuantumRandomEngine();

    readonly lattice=

    new LatticeSignatureEngine();

    readonly hybrid=

    new HybridCryptographyEngine();

    readonly security=

    new QuantumSecurityEngine();

}

// ============================================================================
// FILE:
// /enterprise/quantum/QuantumSimulatorEngine.ts
// ============================================================================

import { QuantumCircuit } from "./QuantumCircuit";

export class QuantumSimulatorEngine{

    execute(

        circuit:QuantumCircuit

    ){

        return{

            circuit,

            executed:true,

            probability:1.0

        };

    }

}

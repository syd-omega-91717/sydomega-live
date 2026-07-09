// ============================================================================
// FILE:
// /enterprise/quantum/QuantumCircuitEngine.ts
// ============================================================================

import { QuantumCircuit } from "./QuantumCircuit";

export class QuantumCircuitEngine{

    compile(

        circuit:QuantumCircuit

    ){

        return{

            compiled:true,

            circuit

        };

    }

}

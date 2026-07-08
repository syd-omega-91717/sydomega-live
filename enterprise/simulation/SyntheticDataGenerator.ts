// ============================================================================
// FILE:
// /enterprise/simulation/SyntheticDataGenerator.ts
// ============================================================================

import { SyntheticDataset } from "./SyntheticDataset";

export class SyntheticDataGenerator{

    generate(

        name:string,

        records:number

    ):SyntheticDataset{

        return{

            id:crypto.randomUUID(),

            name,

            records,

            generatedAt:Date.now()

        };

    }

}

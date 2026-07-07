// ============================================================================
// FILE:
// /core/kernel/MatrixRegistry.ts
// ============================================================================

import { MatrixMetadata } from "./MatrixMetadata";

export class MatrixRegistry{

    private readonly registry=

    new Map<string,MatrixMetadata>();

    register(

        metadata:MatrixMetadata

    ){

        this.registry.set(

            metadata.id,

            metadata

        );

    }

    resolve(

        id:string

    ){

        return this.registry.get(id);

    }

    entries(){

        return[

            ...this.registry.values()

        ];

    }

}

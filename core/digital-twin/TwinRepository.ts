// ============================================================================
// FILE:
// /core/digital-twin/TwinRepository.ts
// ============================================================================

import { TwinEntity } from "./TwinEntity";

export class TwinRepository{

    private readonly twins=

    new Map<string,TwinEntity>();

    save(

        twin:TwinEntity

    ){

        this.twins.set(

            twin.id,

            twin

        );

    }

    find(

        id:string

    ){

        return this.twins.get(id);

    }

}

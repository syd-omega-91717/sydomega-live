// ============================================================================
// FILE:
// /frontend/features/digitalTwin/infrastructure/LoadBalancer.ts
// ============================================================================

export class LoadBalancer{

    private index=0;

    next<T>(

        targets:T[]

    ){

        if(

            targets.length===0

        ){

            return undefined;

        }

        const target=

        targets[

            this.index%

            targets.length

        ];

        this.index++;

        return target;

    }

}

// ============================================================================
// FILE:
// /frontend/features/digitalTwin/cyber/SOCOperationsCenter.ts
// ============================================================================

export interface SecurityCase{

    id:string;

    title:string;

    priority:string;

    status:string;

}

export class SOCOperationsCenter{

    private readonly cases=

    new Map<string,SecurityCase>();

    open(

        securityCase:SecurityCase

    ){

        this.cases.set(

            securityCase.id,

            securityCase

        );

    }

    active(){

        return [...this.cases.values()];

    }

}

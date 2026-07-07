// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/PolicyEngine.ts
// ============================================================================

export interface SecurityPolicy{

    id:string;

    name:string;

    enabled:boolean;

}

export class PolicyEngine{

    private policies=

    new Map<string,SecurityPolicy>();

    register(

        policy:SecurityPolicy

    ){

        this.policies.set(

            policy.id,

            policy

        );

    }

    evaluate(){

        return [...this.policies.values()]

        .every(policy=>policy.enabled);

    }

}

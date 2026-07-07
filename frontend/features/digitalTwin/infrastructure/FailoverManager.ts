// ============================================================================
// FILE:
// /frontend/features/digitalTwin/infrastructure/FailoverManager.ts
// ============================================================================

export class FailoverManager{

    failover<T>(

        primary:T,

        secondary:T,

        healthy:boolean

    ){

        return healthy

        ?primary

        :secondary;

    }

}

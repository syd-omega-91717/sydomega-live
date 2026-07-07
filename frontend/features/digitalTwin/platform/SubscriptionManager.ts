// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/SubscriptionManager.ts
// ============================================================================

export interface Subscription{

    tenantId:string;

    plan:string;

    active:boolean;

}

export class SubscriptionManager{

    private subscriptions=

    new Map<string,Subscription>();

    save(

        subscription:Subscription

    ){

        this.subscriptions.set(

            subscription.tenantId,

            subscription

        );

    }

    find(

        tenantId:string

    ){

        return this.subscriptions.get(

            tenantId

        );

    }

}

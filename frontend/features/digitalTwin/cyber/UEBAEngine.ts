// ============================================================================
// FILE:
// /frontend/features/digitalTwin/cyber/UEBAEngine.ts
// ============================================================================

export interface UserBehavior{

    userId:string;

    score:number;

    anomaly:boolean;

}

export class UEBAEngine{

    evaluate(

        events:number

    ):UserBehavior{

        return{

            userId:crypto.randomUUID(),

            score:events,

            anomaly:events>75

        };

    }

}

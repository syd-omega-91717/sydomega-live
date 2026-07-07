// ============================================================================
// FILE:
// /frontend/features/digitalTwin/c4isr/DispatchEngine.ts
// ============================================================================

export interface DispatchOrder{

    id:string;

    missionId:string;

    resourceId:string;

}

export class DispatchEngine{

    dispatch(

        order:DispatchOrder

    ){

        return{

            dispatched:true,

            order

        };

    }

}

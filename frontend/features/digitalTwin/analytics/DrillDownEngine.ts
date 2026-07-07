// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/DrillDownEngine.ts
// ============================================================================

export class DrillDownEngine{

    filter<T>(

        dataset:T[],

        predicate:(item:T)=>boolean

    ){

        return dataset.filter(

            predicate

        );

    }

}

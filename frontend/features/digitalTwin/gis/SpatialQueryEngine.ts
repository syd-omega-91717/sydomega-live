// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/SpatialQueryEngine.ts
// ============================================================================

export class SpatialQueryEngine{

    query<T>(

        dataset:T[],

        predicate:(item:T)=>boolean

    ){

        return dataset.filter(

            predicate

        );

    }

}

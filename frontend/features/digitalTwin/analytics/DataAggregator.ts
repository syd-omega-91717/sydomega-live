// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/DataAggregator.ts
// ============================================================================

export class DataAggregator{

    groupBy<T>(

        data:T[],

        selector:(item:T)=>string

    ){

        const result=

        new Map<string,T[]>();

        data.forEach(item=>{

            const key=

            selector(item);

            const values=

            result.get(key)??[];

            values.push(item);

            result.set(key,values);

        });

        return result;

    }

}

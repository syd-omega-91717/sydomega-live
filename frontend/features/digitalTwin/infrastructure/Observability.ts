// ============================================================================
// FILE:
// /frontend/features/digitalTwin/infrastructure/Observability.ts
// ============================================================================

export interface Metric{

    name:string;

    value:number;

}

export class Observability{

    private metrics:Metric[]=[];

    record(metric:Metric){

        this.metrics.push(metric);

    }

    all(){

        return this.metrics;

    }

}

// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/KPIWarehouse.ts
// ============================================================================

export interface KPIRecord{

    id:string;

    name:string;

    value:number;

    unit:string;

    timestamp:number;

}

export class KPIWarehouse{

    private records:KPIRecord[]=[];

    insert(record:KPIRecord){

        this.records.push(record);

    }

    all(){

        return this.records;

    }

    latest(name:string){

        return this.records

        .filter(r=>r.name===name)

        .at(-1);

    }

}

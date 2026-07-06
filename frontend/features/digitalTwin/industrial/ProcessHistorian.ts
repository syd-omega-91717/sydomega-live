// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/ProcessHistorian.ts
// ============================================================================

export interface HistorianRecord{

    tag:string;

    timestamp:number;

    value:number;

}

export class ProcessHistorian{

    private records:HistorianRecord[]=[];

    append(

        record:HistorianRecord

    ){

        this.records.push(record);

    }

    history(

        tag:string

    ){

        return this.records.filter(

            record=>record.tag===tag

        );

    }

}

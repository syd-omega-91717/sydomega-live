// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/DataExportService.ts
// ============================================================================

export class DataExportService{

    json(data:unknown){

        return JSON.stringify(

            data,

            null,

            2

        );

    }

    csv(rows:any[]){

        if(rows.length===0){

            return"";

        }

        const header=

        Object.keys(rows[0]).join(",");

        const body=

        rows.map(row=>

            Object.values(row)

            .join(",")

        );

        return[

            header,

            ...body

        ].join("\n");

    }

}

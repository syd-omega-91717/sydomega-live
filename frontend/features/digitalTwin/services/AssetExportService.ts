// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/AssetExportService.ts
// ============================================================================

export class AssetExportService{

    exportJSON(

        assets:any[]

    ){

        return JSON.stringify(

            assets,

            null,

            2

        );

    }

    exportCSV(

        assets:any[]

    ){

        if(!assets.length){

            return "";

        }

        const header=

        Object.keys(

            assets[0]

        ).join(",");

        const rows=

        assets.map(

            asset=>

            Object.values(asset).join(",")

        );

        return[

            header,

            ...rows

        ].join("\n");

    }

}

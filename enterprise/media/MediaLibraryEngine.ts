// ============================================================================
// FILE:
// /enterprise/media/MediaLibraryEngine.ts
// ============================================================================

export class MediaLibraryEngine{

    catalog(

        assetId:string

    ){

        return{

            assetId,

            catalogued:true

        };

    }

}

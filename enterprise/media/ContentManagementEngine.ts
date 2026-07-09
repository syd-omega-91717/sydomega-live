// ============================================================================
// FILE:
// /enterprise/media/ContentManagementEngine.ts
// ============================================================================

export class ContentManagementEngine{

    publish(

        contentId:string

    ){

        return{

            contentId,

            published:true

        };

    }

}

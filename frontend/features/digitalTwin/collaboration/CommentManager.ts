// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/CommentManager.ts
// ============================================================================

export interface Comment{

    id:string;

    assetId:string;

    user:string;

    message:string;

    created:number;

}

export class CommentManager{

    private comments:Comment[]=[];

    add(comment:Comment){

        this.comments.push(comment);

    }

    list(assetId:string){

        return this.comments.filter(

            c=>c.assetId===assetId

        );

    }

}

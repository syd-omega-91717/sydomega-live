// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/AnnotationManager.ts
// ============================================================================

export interface Annotation{

    id:string;

    assetId:string;

    author:string;

    text:string;

    createdAt:number;

}

export class AnnotationManager{

    private annotations:Annotation[]=[];

    add(annotation:Annotation){

        this.annotations.push(annotation);

    }

    remove(id:string){

        this.annotations=

        this.annotations.filter(

            a=>a.id!==id

        );

    }

    find(assetId:string){

        return this.annotations.filter(

            a=>a.assetId===assetId

        );

    }

}

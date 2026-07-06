// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/TagDatabase.ts
// ============================================================================

export interface ProcessTag{

    name:string;

    unit:string;

    value:number;

}

export class TagDatabase{

    private readonly tags=

    new Map<string,ProcessTag>();

    save(tag:ProcessTag){

        this.tags.set(

            tag.name,

            tag

        );

    }

    find(name:string){

        return this.tags.get(name);

    }

    all(){

        return [...this.tags.values()];

    }

}

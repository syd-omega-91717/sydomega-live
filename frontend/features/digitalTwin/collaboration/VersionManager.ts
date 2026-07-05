// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/VersionManager.ts
// ============================================================================

export interface SceneVersion{

    id:string;

    author:string;

    timestamp:number;

    description:string;

}

export class VersionManager{

    private versions:SceneVersion[]=[];

    create(version:SceneVersion){

        this.versions.push(version);

    }

    history(){

        return this.versions;

    }

}

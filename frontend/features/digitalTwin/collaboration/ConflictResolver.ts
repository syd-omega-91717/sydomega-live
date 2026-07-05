// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/ConflictResolver.ts
// ============================================================================

export interface Conflict{

    assetId:string;

    local:any;

    remote:any;

}

export class ConflictResolver{

    resolve(

        conflict:Conflict,

        strategy:

        "LOCAL"|

        "REMOTE"

    ){

        return strategy==="LOCAL"

            ? conflict.local

            : conflict.remote;

    }

}

// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AssetPermissionManager.ts
// ============================================================================

export interface AssetPermission{

    read:boolean;

    write:boolean;

    execute:boolean;

}

export class AssetPermissionManager{

    private readonly permissions=

    new Map<string,AssetPermission>();

    grant(

        assetId:string,

        permission:AssetPermission

    ){

        this.permissions.set(

            assetId,

            permission

        );

    }

    canRead(id:string){

        return this.permissions.get(id)?.read??false;

    }

    canWrite(id:string){

        return this.permissions.get(id)?.write??false;

    }

    canExecute(id:string){

        return this.permissions.get(id)?.execute??false;

    }

}

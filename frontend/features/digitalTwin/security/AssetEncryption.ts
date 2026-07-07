// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/AssetEncryption.ts
// ============================================================================

export class AssetEncryption{

    async encrypt(

        data:string

    ){

        return btoa(data);

    }

    async decrypt(

        data:string

    ){

        return atob(data);

    }

}

// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/MarketplaceService.ts
// ============================================================================

export interface MarketplaceExtension{

    id:string;

    title:string;

    version:string;

}

export class MarketplaceService{

    private extensions:

    MarketplaceExtension[]=[];

    install(

        extension:MarketplaceExtension

    ){

        this.extensions.push(

            extension

        );

    }

    installed(){

        return this.extensions;

    }

}

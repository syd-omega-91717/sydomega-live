// ============================================================================
// FILE:
// /enterprise/commerce/MultiVendorEngine.ts
// ============================================================================

import { Vendor } from "./Vendor";

export class MultiVendorEngine{

    private readonly vendors=

    new Map<string,Vendor>();

    register(

        vendor:Vendor

    ){

        this.vendors.set(

            vendor.id,

            vendor

        );

    }

    all(){

        return [...this.vendors.values()];

    }

}

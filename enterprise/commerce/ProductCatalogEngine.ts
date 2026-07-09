// ============================================================================
// FILE:
// /enterprise/commerce/ProductCatalogEngine.ts
// ============================================================================

import { Product } from "./Product";

export class ProductCatalogEngine{

    register(

        product:Product

    ){

        return{

            product,

            indexed:true

        };

    }

}

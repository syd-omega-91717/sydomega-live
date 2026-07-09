// ============================================================================
// FILE:
// /enterprise/commerce/ProductCatalogEngine.ts
// ============================================================================

import { Product } from "./Product";

export class ProductCatalogEngine{

    private readonly catalog=

    new Map<string,Product>();

    add(

        product:Product

    ){

        this.catalog.set(

            product.id,

            product

        );

    }

    list(){

        return [...this.catalog.values()];

    }

}

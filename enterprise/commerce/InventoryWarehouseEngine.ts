// ============================================================================
// FILE:
// /enterprise/commerce/InventoryWarehouseEngine.ts
// ============================================================================

import { InventoryItem } from "./InventoryItem";

export class InventoryWarehouseEngine{

    receive(

        item:InventoryItem

    ){

        return{

            item,

            stored:true

        };

    }

}

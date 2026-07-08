// ============================================================================
// FILE:
// /enterprise/assets/InventoryEngine.ts
// ============================================================================

import { SparePart } from "./SparePart";

export class InventoryEngine{

    replenish(

        part:SparePart,

        quantity:number

    ){

        part.quantity+=quantity;

        return part;

    }

}

// ============================================================================
// FILE:
// /enterprise/commerce/CommerceOrchestrator.ts
// ============================================================================

import { DynamicPricingEngine } from "./DynamicPricingEngine";
import { FulfillmentEngine } from "./FulfillmentEngine";
import { GlobalTradeEngine } from "./GlobalTradeEngine";
import { InventoryEngine } from "./InventoryEngine";
import { MarketplaceEngine } from "./MarketplaceEngine";
import { MultiVendorEngine } from "./MultiVendorEngine";
import { OrderManagementEngine } from "./OrderManagementEngine";
import { ProcurementEngine } from "./ProcurementEngine";
import { ProductCatalogEngine } from "./ProductCatalogEngine";
import { WarehouseEngine } from "./WarehouseEngine";

export class CommerceOrchestrator{

    readonly marketplace=new MarketplaceEngine();

    readonly vendors=new MultiVendorEngine();

    readonly catalog=new ProductCatalogEngine();

    readonly orders=new OrderManagementEngine();

    readonly procurement=new ProcurementEngine();

    readonly inventory=new InventoryEngine();

    readonly warehouse=new WarehouseEngine();

    readonly trade=new GlobalTradeEngine();

    readonly pricing=new DynamicPricingEngine();

    readonly fulfillment=new FulfillmentEngine();

}

// ============================================================================
// FILE:
// /enterprise/commerce/CommerceOperationsOrchestrator.ts
// ============================================================================

import { DemandForecastEngine } from "./DemandForecastEngine";
import { FleetManagementEngine } from "./FleetManagementEngine";
import { InventoryWarehouseEngine } from "./InventoryWarehouseEngine";
import { MarketplaceEngine } from "./MarketplaceEngine";
import { OrderManagementEngine } from "./OrderManagementEngine";
import { ProcurementVendorEngine } from "./ProcurementVendorEngine";
import { ProductCatalogEngine } from "./ProductCatalogEngine";
import { ReturnsEngine } from "./ReturnsEngine";
import { ShippingLogisticsEngine } from "./ShippingLogisticsEngine";

export class CommerceOperationsOrchestrator{

    readonly marketplace=new MarketplaceEngine();

    readonly catalog=new ProductCatalogEngine();

    readonly inventory=new InventoryWarehouseEngine();

    readonly orders=new OrderManagementEngine();

    readonly logistics=new ShippingLogisticsEngine();

    readonly fleet=new FleetManagementEngine();

    readonly procurement=new ProcurementVendorEngine();

    readonly returns=new ReturnsEngine();

    readonly forecasting=new DemandForecastEngine();

}

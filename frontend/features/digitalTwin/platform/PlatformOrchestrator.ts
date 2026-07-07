// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/PlatformOrchestrator.ts
// ============================================================================

import {

TenantManager

} from "./TenantManager";

import {

FeatureFlagService

} from "./FeatureFlagService";

import {

ConfigurationService

} from "./ConfigurationService";

export class PlatformOrchestrator{

    readonly tenants=

    new TenantManager();

    readonly flags=

    new FeatureFlagService();

    readonly configuration=

    new ConfigurationService();

    status(){

        return{

            tenants:

            this.tenants.all().length,

            ready:true

        };

    }

}

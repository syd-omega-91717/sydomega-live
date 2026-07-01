// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/provisioning-connector.repository.ts
// NEW FILE
// ============================================================================

import { ProvisioningConnectorAggregate }
from "../../domain/aggregates/provisioning-connector.aggregate";

export interface ProvisioningConnectorRepository{

    save(

        aggregate:ProvisioningConnectorAggregate

    ):Promise<void>;

    find(

        connectorId:string

    ):Promise<ProvisioningConnectorAggregate|null>;

    online(

    ):Promise<ProvisioningConnectorAggregate[]>;

}

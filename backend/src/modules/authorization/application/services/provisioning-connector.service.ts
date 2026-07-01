// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/provisioning-connector.service.ts
// NEW FILE
// ============================================================================

import { ProvisioningConnector }
from "../../domain/entities/provisioning-connector";

export interface ProvisioningConnectorService{

    connectors():Promise<ProvisioningConnector[]>;

    synchronize(

        connectorId:string

    ):Promise<void>;

}

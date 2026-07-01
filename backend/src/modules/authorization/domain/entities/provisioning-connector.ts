// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/provisioning-connector.ts
// NEW FILE
// ============================================================================

import { ProvisioningConnectorId }
from "../value-objects/provisioning-connector-id";

import { ConnectorStatus }
from "../enums/connector-status";

export class ProvisioningConnector{

    constructor(

        readonly id:ProvisioningConnectorId,

        readonly name:string,

        readonly vendor:string,

        readonly endpoint:string,

        readonly status:ConnectorStatus,

        readonly capabilities:string[]

    ){}

}

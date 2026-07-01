// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/device-code.service.ts
// NEW FILE
// ============================================================================

import { DeviceCode }
from "../../domain/entities/device-code";

export interface DeviceCodeService{

    issue(

        clientId:string,

        scopes:string[]

    ):Promise<DeviceCode>;

    authorize(

        userCode:string,

        principalId:string

    ):Promise<void>;

}

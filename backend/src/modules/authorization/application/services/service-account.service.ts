// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/service-account.service.ts
// NEW FILE
// ============================================================================

import { ServiceAccount }
from "../../domain/entities/service-account";

export interface ServiceAccountService{

    create(

        ownerId:string,

        name:string

    ):Promise<ServiceAccount>;

    rotateSecret(

        serviceAccountId:string

    ):Promise<void>;

}

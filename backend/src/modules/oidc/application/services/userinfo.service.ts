// ============================================================================
// FILE: /backend/src/modules/oidc/application/services/userinfo.service.ts
// NEW FILE
// ============================================================================

import { UserInfo }
from "../../domain/entities/user-info";

export interface UserInfoService {

    get(

        subject: string,

        scopes: string[]

    ): Promise<UserInfo>;

}

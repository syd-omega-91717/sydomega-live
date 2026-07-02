// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/userinfo.handler.ts
// NEW FILE
// ============================================================================

import { QueryHandler }
from "@/kernel/cqrs";

import { UserInfoQuery }
from "../queries/userinfo.query";

export class UserInfoHandler
implements QueryHandler<UserInfoQuery>{

    async execute(

        query:UserInfoQuery

    ){

        // Resolve OIDC Claims

    }

}

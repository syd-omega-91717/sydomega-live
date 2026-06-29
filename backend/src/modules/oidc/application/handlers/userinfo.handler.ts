// ============================================================================
// FILE: /backend/src/modules/oidc/application/handlers/userinfo.handler.ts
// NEW FILE
// ============================================================================

import { QueryHandler } from "@/kernel/cqrs";
import { UserInfoQuery } from "../queries/userinfo/userinfo.query";

export class UserInfoHandler
implements QueryHandler<UserInfoQuery>{

    async execute(

        query: UserInfoQuery

    ){

        // Load claims

        // Apply claims policy

        // Return userinfo

    }

}

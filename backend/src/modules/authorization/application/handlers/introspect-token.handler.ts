// ============================================================================
// FILE: /backend/src/modules/authorization/application/handlers/introspect-token.handler.ts
// NEW FILE
// ============================================================================

import { QueryHandler }
from "@/kernel/cqrs";

import { IntrospectTokenQuery }
from "../queries/introspect-token.query";

export class IntrospectTokenHandler
implements QueryHandler<IntrospectTokenQuery>{

    async execute(

        query:IntrospectTokenQuery

    ){

        // RFC7662 Introspection

    }

}

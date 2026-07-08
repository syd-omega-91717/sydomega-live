// ============================================================================
// FILE:
// /core/identity/SessionEngine.ts
// ============================================================================

import { IdentitySession } from "./IdentitySession";

export class SessionEngine{

    start(

        session:IdentitySession

    ){

        session.active=true;

        return session;

    }

    terminate(

        session:IdentitySession

    ){

        session.active=false;

        return session;

    }

}

// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/admin-action.ts
// NEW FILE
// ============================================================================

import { AccountAction }
from "../enums/account-action";

export class AdminAction{

    constructor(

        readonly administratorId:string,

        readonly targetUserId:string,

        readonly action:AccountAction,

        readonly reason:string,

        readonly createdAt:Date

    ){}

}

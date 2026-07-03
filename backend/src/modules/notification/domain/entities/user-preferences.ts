// ============================================================================
// FILE: /backend/src/modules/notification/domain/entities/user-preferences.ts
// NEW FILE
// ============================================================================

export class UserPreferences{

    constructor(

        readonly userId:string,

        readonly email:boolean,

        readonly sms:boolean,

        readonly push:boolean,

        readonly inApp:boolean

    ){}

}

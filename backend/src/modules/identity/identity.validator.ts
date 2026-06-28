// ============================================================================
// FILE: /backend/src/modules/identity/identity.validator.ts
// NEW FILE
// ============================================================================

import {

    LoginDto,

    RegisterDto

} from "./identity.dto.js";

export function validateLogin(

    payload: unknown

) {

    return LoginDto.parse(

        payload

    );

}

export function validateRegister(

    payload: unknown

) {

    return RegisterDto.parse(

        payload

    );

}

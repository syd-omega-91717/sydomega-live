// ============================================================================
// FILE: /backend/src/modules/identity/domain/valueObjects/login-context.value-object.ts
// NEW FILE
// ============================================================================

import { Device } from "./device.value-object.js";

export class LoginContext {

    constructor(

        public readonly device: Device,

        public readonly timestamp: Date,

        public readonly source: string

    ) {}

}

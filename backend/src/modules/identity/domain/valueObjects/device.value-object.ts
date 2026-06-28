// ============================================================================
// FILE: /backend/src/modules/identity/domain/valueObjects/device.value-object.ts
// NEW FILE
// ============================================================================

export class Device {

    constructor(

        public readonly ipAddress: string,

        public readonly userAgent: string,

        public readonly platform: string,

        public readonly browser: string,

        public readonly fingerprint: string

    ) {}

}

// ============================================================================
// FILE: /backend/src/modules/identity/domain/valueObjects/session.value-object.ts
// NEW FILE
// ============================================================================

export class Session {

    constructor(

        public readonly sessionId: string,

        public readonly expiresAt: Date,

        public readonly device: string,

        public readonly ipAddress: string

    ) {}

    public expired(): boolean {

        return new Date() >

            this.expiresAt;

    }

}

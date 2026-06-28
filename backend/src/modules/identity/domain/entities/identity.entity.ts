// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/identity.entity.ts
// NEW FILE
// ============================================================================

export class Identity {

    constructor(

        public readonly id: string,

        public email: string,

        public username: string,

        public passwordHash: string,

        public role: string,

        public approvalStatus: string,

        public verificationStatus: string,

        public accountEnabled: boolean,

        public accessState: string,

        public failedLoginCount: number,

        public createdAt: Date,

        public updatedAt: Date

    ) {}

    public isApproved(): boolean {

        return this.approvalStatus === "approved";

    }

    public isEnabled(): boolean {

        return this.accountEnabled;

    }

    public registerFailedLogin(): void {

        this.failedLoginCount++;

    }

    public resetFailedLogins(): void {

        this.failedLoginCount = 0;

    }

    public disable(): void {

        this.accountEnabled = false;

    }

    public enable(): void {

        this.accountEnabled = true;

    }

}

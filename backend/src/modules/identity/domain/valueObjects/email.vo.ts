// ============================================================================
// FILE: /backend/src/modules/identity/domain/valueObjects/email.vo.ts
// NEW FILE
// ============================================================================

export class Email {

    private readonly value: string;

    constructor(email: string) {

        const normalized = email.trim().toLowerCase();

        if (!Email.validate(normalized)) {

            throw new Error("Invalid email.");

        }

        this.value = normalized;

    }

    public static validate(email: string): boolean {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    }

    public toString(): string {

        return this.value;

    }

}

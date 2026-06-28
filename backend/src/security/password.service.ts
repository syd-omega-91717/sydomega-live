// ============================================================================
// FILE: /backend/src/security/password.service.ts
// NEW FILE
// ============================================================================

import bcrypt from "bcrypt";

class PasswordService {

    private readonly rounds = 12;

    /**
     * Hash Password
     */

    public async hash(

        password: string

    ): Promise<string> {

        return bcrypt.hash(

            password,

            this.rounds

        );

    }

    /**
     * Verify Password
     */

    public async verify(

        password: string,

        hash: string

    ): Promise<boolean> {

        return bcrypt.compare(

            password,

            hash

        );

    }

    /**
     * Password Strength
     */

    public validate(

        password: string

    ) {

        return {

            length:

                password.length >= 12,

            uppercase:

                /[A-Z]/.test(password),

            lowercase:

                /[a-z]/.test(password),

            number:

                /\d/.test(password),

            symbol:

                /[^A-Za-z0-9]/.test(password)

        };

    }

    /**
     * Generate Temporary Password
     */

    public generate(

        length = 20

    ): string {

        const chars =

            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

        let result = "";

        for (

            let i = 0;

            i < length;

            i++

        ) {

            result +=

                chars.charAt(

                    Math.floor(

                        Math.random() *

                        chars.length

                    )

                );

        }

        return result;

    }

}

export default new PasswordService();

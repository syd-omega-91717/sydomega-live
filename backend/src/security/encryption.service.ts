// ============================================================================
// FILE: /backend/src/security/encryption.service.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

import env from "../config/env.js";

export class EncryptionService {

    private readonly algorithm = "aes-256-gcm";

    public encrypt(

        value: string

    ) {

        const iv = crypto.randomBytes(12);

        const key = Buffer.from(

            env.ENCRYPTION_KEY,

            "hex"

        );

        const cipher = crypto.createCipheriv(

            this.algorithm,

            key,

            iv

        );

        const encrypted = Buffer.concat([

            cipher.update(value, "utf8"),

            cipher.final()

        ]);

        const tag = cipher.getAuthTag();

        return {

            iv: iv.toString("hex"),

            tag: tag.toString("hex"),

            value: encrypted.toString("hex")

        };

    }

    public decrypt(payload: {

        iv: string;

        tag: string;

        value: string;

    }): string {

        const key = Buffer.from(

            env.ENCRYPTION_KEY,

            "hex"

        );

        const decipher = crypto.createDecipheriv(

            this.algorithm,

            key,

            Buffer.from(payload.iv, "hex")

        );

        decipher.setAuthTag(

            Buffer.from(payload.tag, "hex")

        );

        const decrypted = Buffer.concat([

            decipher.update(

                Buffer.from(payload.value, "hex")

            ),

            decipher.final()

        ]);

        return decrypted.toString("utf8");

    }

}

export default new EncryptionService();

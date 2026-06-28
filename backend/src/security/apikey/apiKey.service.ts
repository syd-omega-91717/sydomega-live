// ============================================================================
// FILE: /backend/src/security/apikey/apiKey.service.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

export interface ApiKey {

    key: string;

    prefix: string;

    hash: string;

}

export class ApiKeyService {

    public generate(): ApiKey {

        const prefix =

            "SYD";

        const random =

            crypto

                .randomBytes(32)

                .toString("hex");

        const key =

            `${prefix}_${random}`;

        const hash =

            crypto

                .createHash("sha256")

                .update(key)

                .digest("hex");

        return {

            key,

            prefix,

            hash

        };

    }

    public verify(

        key: string,

        hash: string

    ): boolean {

        return crypto

            .createHash("sha256")

            .update(key)

            .digest("hex") === hash;

    }

}

export default new ApiKeyService();

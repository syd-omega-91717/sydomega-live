// ============================================================================
// FILE:
// /enterprise/blockchain/CryptographicVault.ts
// ============================================================================

export class CryptographicVault{

    encrypt(

        value:string

    ){

        return Buffer.from(value).toString("base64");

    }

    decrypt(

        value:string

    ){

        return Buffer.from(

            value,

            "base64"

        ).toString();

    }

}

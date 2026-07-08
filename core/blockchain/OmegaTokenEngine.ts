// ============================================================================
// FILE:
// /core/blockchain/OmegaTokenEngine.ts
// ============================================================================

export class OmegaTokenEngine{

    mint(

        address:string,

        amount:number

    ){

        return{

            address,

            amount,

            minted:true

        };

    }

    burn(

        address:string,

        amount:number

    ){

        return{

            address,

            amount,

            burned:true

        };

    }

}

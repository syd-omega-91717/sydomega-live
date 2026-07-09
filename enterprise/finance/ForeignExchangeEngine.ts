// ============================================================================
// FILE:
// /enterprise/finance/ForeignExchangeEngine.ts
// ============================================================================

export class ForeignExchangeEngine{

    convert(

        amount:number,

        from:string,

        to:string

    ){

        return{

            amount,

            from,

            to,

            converted:true

        };

    }

}

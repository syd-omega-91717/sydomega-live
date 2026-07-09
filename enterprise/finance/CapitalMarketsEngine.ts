// ============================================================================
// FILE:
// /enterprise/finance/CapitalMarketsEngine.ts
// ============================================================================

export class CapitalMarketsEngine{

    executeTrade(

        symbol:string,

        quantity:number

    ){

        return{

            symbol,

            quantity,

            executed:true

        };

    }

}

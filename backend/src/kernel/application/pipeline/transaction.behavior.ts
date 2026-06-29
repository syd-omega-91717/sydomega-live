// ============================================================================
// FILE: /backend/src/kernel/application/pipeline/transaction.behavior.ts
// NEW FILE
// ============================================================================

import { UnitOfWork }

from "../../infrastructure/unit-of-work.js";

export class TransactionBehavior{

    constructor(

        private readonly uow:UnitOfWork

    ){}

    async handle(

        request:any,

        next:()=>Promise<any>

    ){

        await this.uow.begin();

        try{

            const result=

                await next();

            await this.uow.commit();

            return result;

        }

        catch(error){

            await this.uow.rollback();

            throw error;

        }

    }

}

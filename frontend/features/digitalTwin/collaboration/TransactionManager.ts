// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/TransactionManager.ts
// ============================================================================

export class TransactionManager{

    async transaction(

        callback:()=>Promise<void>

    ){

        try{

            await callback();

        }catch(error){

            throw error;

        }

    }

}

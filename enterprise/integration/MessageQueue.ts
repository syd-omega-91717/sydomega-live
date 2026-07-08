// ============================================================================
// FILE:
// /enterprise/integration/MessageQueue.ts
// ============================================================================

export class MessageQueue{

    async enqueue(

        queue:string,

        message:unknown

    ){

        return{

            queue,

            accepted:true

        };

    }

    async dequeue(

        queue:string

    ){

        return{

            queue,

            message:null

        };

    }

}

// ============================================================================
// FILE:
// /core/ai/ConversationEngine.ts
// ============================================================================

export class ConversationEngine{

    private history:string[]=[];

    append(

        message:string

    ){

        this.history.push(message);

    }

    all(){

        return this.history;

    }

}

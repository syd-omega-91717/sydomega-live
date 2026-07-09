// ============================================================================
// FILE:
// /enterprise/communications/EnterpriseMessagingEngine.ts
// ============================================================================

import { Message } from "./Message";

export class EnterpriseMessagingEngine{

    send(

        message:Message

    ){

        return{

            message,

            delivered:true

        };

    }

}

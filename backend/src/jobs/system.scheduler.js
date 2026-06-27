// ============================================================================
// FILE: /backend/src/jobs/system.scheduler.js
// NEW FILE
// ============================================================================

import { expireAll } from "../services/access.service.js";
import * as Events from "../services/event.service.js";

export function startScheduler(){

    setInterval(async()=>{

        try{

            const expired=await expireAll();

            if(expired>0){

                await Events.publish(

                    null,

                    null,

                    "scheduler",

                    "expired_accounts",

                    {

                        expired

                    }

                );

            }

        }

        catch(error){

            console.error(error);

        }

    },60000);

}

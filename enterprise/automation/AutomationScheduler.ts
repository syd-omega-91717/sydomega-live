// ============================================================================
// FILE:
// /enterprise/automation/AutomationScheduler.ts
// ============================================================================

export class AutomationScheduler{

    schedule(

        automation:string,

        cron:string

    ){

        return{

            automation,

            cron

        };

    }

}

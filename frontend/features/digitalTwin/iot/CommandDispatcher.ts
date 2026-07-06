// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/CommandDispatcher.ts
// ============================================================================

export interface DeviceCommand{

    deviceId:string;

    command:string;

    payload:unknown;

}

export class CommandDispatcher{

    async dispatch(

        command:DeviceCommand

    ){

        return{

            accepted:true,

            command

        };

    }

}

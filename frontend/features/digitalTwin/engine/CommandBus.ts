// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/CommandBus.ts
// ============================================================================

export interface Command<T=unknown>{

    type:string;

    payload:T;

}

type Handler=(payload:any)=>Promise<void>|void;

export class CommandBus{

    private readonly handlers=

    new Map<string,Handler>();

    register(

        type:string,

        handler:Handler

    ){

        this.handlers.set(type,handler);

    }

    async execute<T>(

        command:Command<T>

    ){

        const handler=

        this.handlers.get(command.type);

        if(!handler){

            throw new Error(

                `Command ${command.type} not registered`

            );

        }

        await handler(command.payload);

    }

}

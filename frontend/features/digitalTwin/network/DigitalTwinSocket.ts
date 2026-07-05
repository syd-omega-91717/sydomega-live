// ============================================================================
// FILE:
// /frontend/features/digitalTwin/network/DigitalTwinSocket.ts
// ============================================================================

export type TwinMessageHandler=(payload:any)=>void;

export class DigitalTwinSocket{

    private socket?:WebSocket;

    private handlers=new Map<string,TwinMessageHandler[]>();

    connect(url:string){

        this.socket=new WebSocket(url);

        this.socket.onmessage=(event)=>{

            const message=JSON.parse(event.data);

            const listeners=

            this.handlers.get(message.type)||[];

            listeners.forEach(listener=>listener(message.payload));

        };

    }

    subscribe(

        topic:string,

        handler:TwinMessageHandler

    ){

        const listeners=

        this.handlers.get(topic)||[];

        listeners.push(handler);

        this.handlers.set(topic,listeners);

    }

    publish(

        topic:string,

        payload:any

    ){

        this.socket?.send(JSON.stringify({

            topic,

            payload

        }));

    }

    disconnect(){

        this.socket?.close();

    }

}

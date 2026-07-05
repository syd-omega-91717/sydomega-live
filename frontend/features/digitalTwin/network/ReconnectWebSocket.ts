// ============================================================================
// FILE:
// /frontend/features/digitalTwin/network/ReconnectWebSocket.ts
// ============================================================================

export interface SocketOptions{

    reconnectInterval:number;

    maxReconnectAttempts:number;

}

export class ReconnectWebSocket{

    private socket?:WebSocket;

    private attempts=0;

    constructor(

        private readonly url:string,

        private readonly options:SocketOptions

    ){}

    connect(){

        this.socket=new WebSocket(this.url);

        this.socket.onopen=()=>{

            this.attempts=0;

        };

        this.socket.onclose=()=>{

            this.reconnect();

        };

    }

    private reconnect(){

        if(

            this.attempts>=

            this.options.maxReconnectAttempts

        ){

            return;

        }

        this.attempts++;

        setTimeout(()=>{

            this.connect();

        },this.options.reconnectInterval);

    }

    instance(){

        return this.socket;

    }

}

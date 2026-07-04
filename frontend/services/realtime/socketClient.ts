// ============================================================================
// FILE:
// /frontend/services/realtime/socketClient.ts
// ============================================================================

import configuration from "@/config/environment";

import { RealtimeEvent } from "./eventTypes";

type EventHandler = (event: RealtimeEvent) => void;

class SocketClient {

    private socket?: WebSocket;

    private handlers: Map<string, Set<EventHandler>> = new Map();

    connect(): void {

        if (typeof window === "undefined") return;

        this.socket = new WebSocket(configuration.websocketUrl);

        this.socket.onmessage = (message) => {

            const event: RealtimeEvent = JSON.parse(message.data);

            this.dispatch(event);

        };

    }

    private dispatch(event: RealtimeEvent): void {

        const set = this.handlers.get(event.type);

        if (!set) return;

        set.forEach(handler => handler(event));

    }

    subscribe(type: string, handler: EventHandler): void {

        if (!this.handlers.has(type)) {

            this.handlers.set(type, new Set());

        }

        this.handlers.get(type)!.add(handler);

    }

    unsubscribe(type: string, handler: EventHandler): void {

        this.handlers.get(type)?.delete(handler);

    }

    send(event: RealtimeEvent): void {

        this.socket?.send(JSON.stringify(event));

    }

}

export default new SocketClient();

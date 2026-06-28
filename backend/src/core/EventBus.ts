// ============================================================================
// FILE: /backend/src/core/EventBus.ts
// NEW FILE
// ============================================================================

import { EventEmitter } from "node:events";

import logger from "../config/logger.js";

export interface DomainEvent<T = unknown> {

    id: string;

    name: string;

    timestamp: Date;
    source: string;

    correlationId?: string;

    payload: T;

}

export type EventHandler<T = unknown> = (

    event: DomainEvent<T>

) => void | Promise<void>;

class EventBus {

    private readonly emitter: EventEmitter;

    constructor() {

        this.emitter = new EventEmitter();

        this.emitter.setMaxListeners(100);

    }

    /**
     * Subscribe to an event.
     */
    public on<T = unknown>(

        eventName: string,

        handler: EventHandler<T>

    ): void {

        this.emitter.on(

            eventName,

            async (event: DomainEvent<T>) => {

                try {

                    await handler(event);

                }

                catch (error) {

                    logger.error({

                        event: eventName,

                        error

                    });

                }

            }

        );

    }

    /**
     * Subscribe once.
     */
    public once<T = unknown>(

        eventName: string,

        handler: EventHandler<T>

    ): void {

        this.emitter.once(

            eventName,

            async (event: DomainEvent<T>) => {

                try {

                    await handler(event);

                }

                catch (error) {

                    logger.error({

                        event: eventName,

                        error

                    });

                }

            }

        );

    }

    /**
     * Remove a subscriber.
     */
    public off<T = unknown>(

        eventName: string,

        handler: EventHandler<T>

    ): void {

        this.emitter.off(

            eventName,

            handler

        );

    }

    /**
     * Publish an event.
     */
    public async publish<T = unknown>(

        event: DomainEvent<T>

    ): Promise<void> {

        logger.info({

            type: "event",

            event: event.name,

            source: event.source,

            correlationId: event.correlationId,

            timestamp: event.timestamp

        });

        this.emitter.emit(

            event.name,

            event

        );

    }

    /**
     * Publish using simple syntax.
     */
    public async emit<T = unknown>(

        name: string,

        payload: T,

        source = "system",

        correlationId?: string

    ): Promise<void> {

        await this.publish({

            id: crypto.randomUUID(),

            name,

            timestamp: new Date(),

            source,

            correlationId,

            payload

        });

    }

    /**
     * Remove all listeners.
     */
    public clear(): void {

        this.emitter.removeAllListeners();

    }

    /**
     * Number of listeners.
     */
    public listenerCount(

        eventName: string

    ): number {

        return this.emitter.listenerCount(

            eventName

        );

    }

    /**
     * Registered event names.
     */
    public events(): string[] {

        return this.emitter

            .eventNames()

            .map(String);

    }

}

const eventBus = new EventBus();

export default eventBus;

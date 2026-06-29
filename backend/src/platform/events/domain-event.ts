// ============================================================================
// FILE: /backend/src/platform/events/domain-event.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

import type {

    DomainEvent

}

from "./domain-event.interface.js";

export abstract class BaseDomainEvent

implements DomainEvent {

    readonly id = crypto.randomUUID();

    readonly occurredAt = new Date();

    abstract readonly name: string;

    constructor(

        public readonly aggregateId: string,

        public readonly payload: unknown

    ) {}

}

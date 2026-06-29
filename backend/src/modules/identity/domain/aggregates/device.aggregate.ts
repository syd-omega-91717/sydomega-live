// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/device.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot } from "@/kernel/domain/aggregate-root";

import { DeviceId } from "../value-objects/device-id";

import { UserId } from "../value-objects/user-id";

import { DeviceFingerprint } from "../value-objects/device-fingerprint";

import { DeviceTrustLevel } from "../enums/device-trust-level";

export class DeviceAggregate
extends AggregateRoot<DeviceId>{

    private constructor(

        id: DeviceId,

        private readonly userId: UserId,

        private fingerprint: DeviceFingerprint,

        private trust: DeviceTrustLevel

    ){

        super(id);

    }

}

// ============================================================================
// FILE:
// /enterprise/manufacturing/IndustrialIoTEngine.ts
// ============================================================================

import { IndustrialDevice } from "./IndustrialDevice";

export class IndustrialIoTEngine{

    private readonly devices=

    new Map<string,IndustrialDevice>();

    register(

        device:IndustrialDevice

    ){

        this.devices.set(

            device.id,

            device

        );

    }

    devicesList(){

        return [...this.devices.values()];

    }

}

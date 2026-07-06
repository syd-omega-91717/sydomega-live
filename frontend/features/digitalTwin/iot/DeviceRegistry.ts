// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/DeviceRegistry.ts
// ============================================================================

export interface IoTDevice{

    id:string;

    name:string;

    protocol:string;

    status:string;

    location:string;

}

export class DeviceRegistry{

    private readonly devices=

    new Map<string,IoTDevice>();

    register(device:IoTDevice){

        this.devices.set(device.id,device);

    }

    remove(id:string){

        this.devices.delete(id);

    }

    find(id:string){

        return this.devices.get(id);

    }

    all(){

        return [...this.devices.values()];

    }

}

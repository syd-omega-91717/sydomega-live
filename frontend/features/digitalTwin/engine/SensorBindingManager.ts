// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SensorBindingManager.ts
// ============================================================================

export interface SensorBinding{

    sensorId:string;

    assetId:string;

    property:string;

}

export class SensorBindingManager{

    private bindings=

    new Map<string,SensorBinding>();

    bind(

        binding:SensorBinding

    ){

        this.bindings.set(

            binding.sensorId,

            binding

        );

    }

    resolve(

        sensorId:string

    ){

        return this.bindings.get(sensorId);

    }

}

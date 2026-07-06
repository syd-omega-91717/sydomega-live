// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/ModbusClient.ts
// ============================================================================

export class ModbusClient{

    async readRegister(

        address:number

    ){

        return{

            address,

            value:0

        };

    }

    async writeRegister(

        address:number,

        value:number

    ){

        return{

            address,

            value

        };

    }

}

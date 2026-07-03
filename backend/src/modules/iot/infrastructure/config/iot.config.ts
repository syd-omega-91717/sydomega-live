// ============================================================================
// FILE: /backend/src/modules/iot/infrastructure/config/iot.config.ts
// NEW FILE
// ============================================================================

export const IoTConfiguration={

    mqttBroker:true,

    mqttVersion:"5.0",

    edgeRuntime:true,

    edgeAI:true,

    otaUpdates:true,

    predictiveMaintenance:true,

    fleetManagement:true,

    industrialProtocols:[
        "OPC-UA",
        "Modbus",
        "BACnet"
    ]

};

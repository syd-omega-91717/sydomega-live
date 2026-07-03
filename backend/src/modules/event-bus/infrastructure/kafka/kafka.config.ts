// ============================================================================
// FILE: /backend/src/modules/event-bus/infrastructure/kafka/kafka.config.ts
// NEW FILE
// ============================================================================

export const KafkaConfiguration={

    brokers:[

        "kafka-1:9092",

        "kafka-2:9092",

        "kafka-3:9092"

    ],

    replicationFactor:3,

    minInSyncReplicas:2,

    enableIdempotence:true

};

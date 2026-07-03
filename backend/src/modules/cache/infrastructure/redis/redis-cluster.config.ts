// ============================================================================
// FILE: /backend/src/modules/cache/infrastructure/redis/redis-cluster.config.ts
// NEW FILE
// ============================================================================

export const RedisCluster={

    cluster:true,

    sentinels:3,

    replicas:3,

    persistence:"AOF",

    failover:true,

    tls:true

};

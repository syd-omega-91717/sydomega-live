// ============================================================================
// FILE: /backend/src/modules/model-registry/domain/enums/deployment-strategy.ts
// NEW FILE
// ============================================================================

export enum DeploymentStrategy{

    BlueGreen="BLUE_GREEN",

    Canary="CANARY",

    Rolling="ROLLING",

    Shadow="SHADOW",

    ABTesting="AB_TESTING"

}

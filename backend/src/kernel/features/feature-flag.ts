// ============================================================================
// FILE: /backend/src/kernel/features/feature-flag.ts
// NEW FILE
// ============================================================================

export interface FeatureFlag {

    readonly key: string;

    readonly enabled: boolean;

    readonly description?: string;

}

// ============================================================================
// FILE: /backend/src/platform/config/featureFlags.ts
// NEW FILE
// ============================================================================

export interface FeatureFlags {

    realtime: boolean;

    ai: boolean;

    academy: boolean;

    consultancy: boolean;

    publishing: boolean;

    marketplace: boolean;

    wallet: boolean;

    analytics: boolean;

    notifications: boolean;

}

const featureFlags: FeatureFlags = {

    realtime: true,

    ai: true,

    academy: true,

    consultancy: true,

    publishing: true,

    marketplace: true,

    wallet: true,

    analytics: true,

    notifications: true

};

export default featureFlags;

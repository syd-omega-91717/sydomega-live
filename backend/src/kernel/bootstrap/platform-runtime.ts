// ============================================================================
// FILE: /backend/src/kernel/bootstrap/platform-runtime.ts
// NEW FILE
// ============================================================================

export interface PlatformRuntime {

    start(): Promise<void>;

    stop(): Promise<void>;

    health(): Promise<boolean>;

}

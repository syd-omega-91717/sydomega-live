// ============================================================================
// FILE: /backend/src/kernel/bootstrap/runtime-builder.ts
// NEW FILE
// ============================================================================

export interface RuntimeBuilder {

    configure(): Promise<void>;

    registerModules(): Promise<void>;

    build(): Promise<PlatformRuntime>;

}

// ============================================================================
// FILE: /backend/src/modules/founder/domain/runtime/widget-runtime.interface.ts
// NEW FILE
// ============================================================================

export interface WidgetRuntime<TData = unknown> {

    readonly id: string;

    readonly version: string;

    readonly category: string;

    readonly refreshInterval: number;

    initialize(): Promise<void>;

    load(): Promise<TData>;

    refresh(): Promise<TData>;

    dispose(): Promise<void>;

}

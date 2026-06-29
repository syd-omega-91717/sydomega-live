// ============================================================================
// FILE: /backend/src/modules/founder/domain/widgets/widget.interface.ts
// NEW FILE
// ============================================================================

export interface FounderWidget<TData = unknown> {

    readonly id: string;

    readonly title: string;

    readonly category: string;

    readonly version: string;

    readonly refreshInterval: number;

    readonly websocketChannel: string;

    load(): Promise<TData>;

}

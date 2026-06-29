// ============================================================================
// FILE: /backend/src/modules/founder/domain/entities/widget-manifest.entity.ts
// NEW FILE
// ============================================================================

export interface WidgetManifest {

    id: string;

    version: string;

    title: string;

    description: string;

    category: string;

    icon: string;

    route: string;

    endpoint: string;

    websocketChannel: string;

    permissions: string[];

    refreshInterval: number;

    cacheSeconds: number;

    priority: number;

    width:

        | 1
        | 2
        | 3
        | 4;

    height:

        | 1
        | 2
        | 3
        | 4;

    resizable: boolean;

    movable: boolean;

    closable: boolean;

    aiEnabled: boolean;

    realtime: boolean;

    enabled: boolean;

}

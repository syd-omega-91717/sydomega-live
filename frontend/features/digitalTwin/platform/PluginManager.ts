// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/PluginManager.ts
// ============================================================================

export interface PlatformPlugin{

    id:string;

    name:string;

    initialize():Promise<void>;

}

export class PluginManager{

    private plugins=

    new Map<string,PlatformPlugin>();

    register(

        plugin:PlatformPlugin

    ){

        this.plugins.set(

            plugin.id,

            plugin

        );

    }

    all(){

        return [...this.plugins.values()];

    }

}

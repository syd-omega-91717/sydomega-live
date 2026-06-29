// ============================================================================
// FILE: /backend/src/kernel/bootstrap/module-registry.ts
// NEW FILE
// ============================================================================

export interface PlatformModule {

    readonly name: string;

    initialize(): Promise<void>;

    shutdown(): Promise<void>;

}

export class ModuleRegistry {

    private readonly modules: PlatformModule[] = [];

    register(

        module: PlatformModule

    ) {

        this.modules.push(module);

    }

    async initialize() {

        for (const module of this.modules) {

            await module.initialize();

        }

    }

    async shutdown() {

        for (const module of [...this.modules].reverse()) {

            await module.shutdown();

        }

    }

}

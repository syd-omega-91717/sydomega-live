// ============================================================================
// FILE: /backend/src/platform/kernel/platform.ts
// NEW FILE
// ============================================================================

import type { Express } from "express";

export interface PlatformComponent {

    readonly name: string;

    initialize(): Promise<void>;

    shutdown(): Promise<void>;

}

export class PlatformKernel {

    private readonly components: PlatformComponent[] = [];

    private application?: Express;

    public register(

        component: PlatformComponent

    ): void {

        this.components.push(

            component

        );

    }

    public async boot(

        app: Express

    ): Promise<void> {

        this.application = app;

        for (

            const component

            of this.components

        ) {

            await component.initialize();

            console.log(

                `✓ ${component.name}`

            );

        }

    }

    public async shutdown(): Promise<void> {

        for (

            const component

            of [...this.components].reverse()

        ) {

            await component.shutdown();

        }

    }

    public express(): Express {

        if (!this.application) {

            throw new Error(

                "Platform not initialized."

            );

        }

        return this.application;

    }

}

export default new PlatformKernel();

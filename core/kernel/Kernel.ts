// ============================================================================
// FOUNDATION KERNEL FK-001
// FILE:
// /core/kernel/Kernel.ts
// ============================================================================

import { MatrixBootstrap } from "./MatrixBootstrap";
import { MatrixRegistry } from "./MatrixRegistry";
import { MatrixRuntime } from "./MatrixRuntime";
import { MatrixVersion } from "./MatrixVersion";

export class Kernel{

    readonly version=new MatrixVersion();

    readonly registry=new MatrixRegistry();

    readonly runtime=new MatrixRuntime();

    readonly bootstrap=new MatrixBootstrap(

        this.registry,

        this.runtime

    );

    async initialize(){

        await this.bootstrap.initialize();

    }

}

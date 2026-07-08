// ============================================================================
// FILE:
// /core/elements/TransformationOrchestrator.ts
// ============================================================================

import { WoodEngine } from "./WoodEngine";
import { FireEngine } from "./FireEngine";
import { EarthEngine } from "./EarthEngine";
import { MetalEngine } from "./MetalEngine";
import { WaterEngine } from "./WaterEngine";
import { TransformationEngine } from "./TransformationEngine";
import { TransformationPipeline } from "./TransformationPipeline";

export class TransformationOrchestrator{

    readonly wood=

    new WoodEngine();

    readonly fire=

    new FireEngine();

    readonly earth=

    new EarthEngine();

    readonly metal=

    new MetalEngine();

    readonly water=

    new WaterEngine();

    readonly engine=

    new TransformationEngine();

    readonly pipeline=

    new TransformationPipeline();

}

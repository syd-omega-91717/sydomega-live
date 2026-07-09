// ============================================================================
// FILE:
// /enterprise/media/MediaOperationsOrchestrator.ts
// ============================================================================

import { AIMediaGenerationEngine } from "./AIMediaGenerationEngine";
import { ContentManagementEngine } from "./ContentManagementEngine";
import { CreativeProjectEngine } from "./CreativeProjectEngine";
import { DigitalAssetManagementEngine } from "./DigitalAssetManagementEngine";
import { LiveStreamingEngine } from "./LiveStreamingEngine";
import { MediaLibraryEngine } from "./MediaLibraryEngine";
import { PodcastPlatformEngine } from "./PodcastPlatformEngine";
import { RenderingFarmEngine } from "./RenderingFarmEngine";
import { VideoProcessingEngine } from "./VideoProcessingEngine";

export class MediaOperationsOrchestrator{

    readonly dam=new DigitalAssetManagementEngine();

    readonly library=new MediaLibraryEngine();

    readonly video=new VideoProcessingEngine();

    readonly streaming=new LiveStreamingEngine();

    readonly podcast=new PodcastPlatformEngine();

    readonly cms=new ContentManagementEngine();

    readonly creative=new CreativeProjectEngine();

    readonly rendering=new RenderingFarmEngine();

    readonly ai=new AIMediaGenerationEngine();

}

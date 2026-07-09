// ============================================================================
// FILE:
// /enterprise/media/PodcastPlatformEngine.ts
// ============================================================================

export class PodcastPlatformEngine{

    publishEpisode(

        episodeId:string

    ){

        return{

            episodeId,

            published:true

        };

    }

}

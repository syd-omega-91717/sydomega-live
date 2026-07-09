// ============================================================================
// FILE:
// /enterprise/communications/VideoConferenceEngine.ts
// ============================================================================

import { Meeting } from "./Meeting";

export class VideoConferenceEngine{

    launch(

        meeting:Meeting

    ){

        return{

            meeting,

            active:true

        };

    }

}

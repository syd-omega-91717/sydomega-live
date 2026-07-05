// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/WebRTCCollaboration.ts
// ============================================================================

export class WebRTCCollaboration{

    private peer?:RTCPeerConnection;

    initialize(){

        this.peer=

        new RTCPeerConnection();

    }

    connection(){

        return this.peer;

    }

    close(){

        this.peer?.close();

    }

}

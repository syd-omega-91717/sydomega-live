// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/PlaybackController.ts
// ============================================================================

export class PlaybackController{

    private playing=false;

    private speed=1;

    play(){

        this.playing=true;

    }

    pause(){

        this.playing=false;

    }

    setSpeed(speed:number){

        this.speed=speed;

    }

    state(){

        return{

            playing:this.playing,

            speed:this.speed

        };

    }

}

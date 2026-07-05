// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/SimulationClock.ts
// ============================================================================

export class SimulationClock{

    private speed=1;

    private running=false;

    private time=0;

    update(delta:number){

        if(!this.running){

            return;

        }

        this.time+=delta*this.speed;

    }

    play(){

        this.running=true;

    }

    pause(){

        this.running=false;

    }

    seek(time:number){

        this.time=time;

    }

    setSpeed(speed:number){

        this.speed=speed;

    }

    current(){

        return this.time;

    }

}

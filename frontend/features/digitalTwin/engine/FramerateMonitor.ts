// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/FramerateMonitor.ts
// ============================================================================

export class FramerateMonitor{

    private frames=0;

    private fps=0;

    private previous=performance.now();

    update(){

        this.frames++;

        const now=performance.now();

        if(now-this.previous>=1000){

            this.fps=this.frames;

            this.frames=0;

            this.previous=now;

        }

    }

    value(){

        return this.fps;

    }

}

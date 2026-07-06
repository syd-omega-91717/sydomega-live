// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/ParticleEngine.ts
// ============================================================================

export interface Particle{

    x:number;

    y:number;

    z:number;

    life:number;

}

export class ParticleEngine{

    update(

        particles:Particle[]

    ){

        return particles.filter(

            particle=>particle.life>0

        );

    }

}

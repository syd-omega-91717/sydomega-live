// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/PhysicsEngine.ts
// ============================================================================

export interface PhysicsBody{

    id:string;

    mass:number;

    enabled:boolean;

}

export class PhysicsEngine{

    private readonly bodies=

    new Map<string,PhysicsBody>();

    register(body:PhysicsBody){

        this.bodies.set(

            body.id,

            body

        );

    }

    remove(id:string){

        this.bodies.delete(id);

    }

    step(

        delta:number

    ){

        return{

            delta,

            bodies:this.bodies.size

        };

    }

}

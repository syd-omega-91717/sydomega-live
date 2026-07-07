// ============================================================================
// FILE:
// /frontend/features/digitalTwin/c4isr/MissionManager.ts
// ============================================================================

export interface Mission{

    id:string;

    name:string;

    status:
        |"PLANNED"
        |"ACTIVE"
        |"COMPLETED"
        |"CANCELLED";

    priority:number;

}

export class MissionManager{

    private readonly missions=

    new Map<string,Mission>();

    create(

        mission:Mission

    ){

        this.missions.set(

            mission.id,

            mission

        );

    }

    update(

        mission:Mission

    ){

        this.missions.set(

            mission.id,

            mission

        );

    }

    find(id:string){

        return this.missions.get(id);

    }

    all(){

        return [...this.missions.values()];

    }

}

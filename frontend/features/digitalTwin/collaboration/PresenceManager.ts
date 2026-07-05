// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/PresenceManager.ts
// ============================================================================

export interface Presence{

    userId:string;

    username:string;

    color:string;

    assetId?:string;

    lastSeen:number;

}

export class PresenceManager{

    private readonly users=

    new Map<string,Presence>();

    update(presence:Presence){

        this.users.set(

            presence.userId,

            presence

        );

    }

    remove(userId:string){

        this.users.delete(userId);

    }

    list(){

        return [...this.users.values()];

    }

}

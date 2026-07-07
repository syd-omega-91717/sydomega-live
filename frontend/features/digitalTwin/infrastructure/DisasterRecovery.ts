// ============================================================================
// FILE:
// /frontend/features/digitalTwin/infrastructure/DisasterRecovery.ts
// ============================================================================

export interface BackupSnapshot{

    id:string;

    timestamp:number;

    location:string;

}

export class DisasterRecovery{

    private snapshots:

    BackupSnapshot[]=[];

    backup(

        snapshot:BackupSnapshot

    ){

        this.snapshots.push(snapshot);

    }

    latest(){

        return this.snapshots.at(-1);

    }

}

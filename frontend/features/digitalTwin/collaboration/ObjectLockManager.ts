// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/ObjectLockManager.ts
// ============================================================================

export interface ObjectLock{

    assetId:string;

    userId:string;

    expiresAt:number;

}

export class ObjectLockManager{

    private readonly locks=

    new Map<string,ObjectLock>();

    lock(lock:ObjectLock){

        if(this.locks.has(lock.assetId)){

            return false;

        }

        this.locks.set(

            lock.assetId,

            lock

        );

        return true;

    }

    unlock(assetId:string){

        this.locks.delete(assetId);

    }

    isLocked(assetId:string){

        return this.locks.has(assetId);

    }

}

// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/DistributedCache.ts
// ============================================================================

export class DistributedCache<T>{

    private readonly cache=

    new Map<string,T>();

    set(

        key:string,

        value:T

    ){

        this.cache.set(key,value);

    }

    get(

        key:string

    ){

        return this.cache.get(key);

    }

    invalidate(

        key:string

    ){

        this.cache.delete(key);

    }

    clear(){

        this.cache.clear();

    }

}

// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/MemoryMonitor.ts
// ============================================================================

export class MemoryMonitor{

    usage(){

        const memory=(performance as any).memory;

        if(!memory){

            return null;

        }

        return{

            used:memory.usedJSHeapSize,

            total:memory.totalJSHeapSize,

            limit:memory.jsHeapSizeLimit

        };

    }

}

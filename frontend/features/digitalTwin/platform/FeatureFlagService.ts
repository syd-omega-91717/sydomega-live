// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/FeatureFlagService.ts
// ============================================================================

export class FeatureFlagService{

    private flags=

    new Map<string,boolean>();

    enable(name:string){

        this.flags.set(name,true);

    }

    disable(name:string){

        this.flags.set(name,false);

    }

    enabled(name:string){

        return this.flags.get(name)

        ??false;

    }

}

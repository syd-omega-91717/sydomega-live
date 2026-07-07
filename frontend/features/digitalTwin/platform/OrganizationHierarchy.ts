// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/OrganizationHierarchy.ts
// ============================================================================

export interface OrganizationUnit{

    id:string;

    parentId?:string;

    name:string;

    type:string;

}

export class OrganizationHierarchy{

    private readonly units=

    new Map<string,OrganizationUnit>();

    register(

        unit:OrganizationUnit

    ){

        this.units.set(

            unit.id,

            unit

        );

    }

    children(

        parentId:string

    ){

        return [...this.units.values()]

        .filter(

            unit=>unit.parentId===parentId

        );

    }

    all(){

        return [...this.units.values()];

    }

}

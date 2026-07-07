// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/TenantManager.ts
// ============================================================================

export interface Tenant{

    id:string;

    name:string;

    active:boolean;

    createdAt:number;

}

export class TenantManager{

    private readonly tenants=

    new Map<string,Tenant>();

    create(

        tenant:Tenant

    ){

        this.tenants.set(

            tenant.id,

            tenant

        );

    }

    update(

        tenant:Tenant

    ){

        this.tenants.set(

            tenant.id,

            tenant

        );

    }

    remove(id:string){

        this.tenants.delete(id);

    }

    find(id:string){

        return this.tenants.get(id);

    }

    all(){

        return [...this.tenants.values()];

    }

}

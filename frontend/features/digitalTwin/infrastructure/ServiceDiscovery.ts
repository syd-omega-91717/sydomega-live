// ============================================================================
// FILE:
// /frontend/features/digitalTwin/infrastructure/ServiceDiscovery.ts
// ============================================================================

export interface ServiceEndpoint{

    name:string;

    url:string;

}

export class ServiceDiscovery{

    private readonly services=

    new Map<string,ServiceEndpoint>();

    register(

        service:ServiceEndpoint

    ){

        this.services.set(

            service.name,

            service

        );

    }

    resolve(

        name:string

    ){

        return this.services.get(name);

    }

}

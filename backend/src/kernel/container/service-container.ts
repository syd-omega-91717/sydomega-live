// ============================================================================
// FILE: /backend/src/kernel/container/service-container.ts
// NEW FILE
// ============================================================================

export class ServiceContainer {

    private readonly services = new Map<string, unknown>();

    register<T>(

        token: string,

        instance: T

    ) {

        this.services.set(token, instance);

    }

    resolve<T>(token: string): T {

        const service = this.services.get(token);

        if (!service) {

            throw new Error(

                `Service '${token}' not registered.`

            );

        }

        return service as T;

    }

}

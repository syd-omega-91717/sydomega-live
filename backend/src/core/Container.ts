// ============================================================================
// FILE: /backend/src/core/Container.ts
// NEW FILE
// ============================================================================

/**
 * Ω SYD OMEGA 91717
 * RC3.1
 *
 * Lightweight Dependency Injection Container.
 *
 * This container becomes the composition root of the application.
 * Every repository, service, controller, gateway, AI engine,
 * websocket service and background worker will eventually be
 * resolved through this class.
 */

export type Constructor<T> = new (...args: unknown[]) => T;

export type Factory<T> = (container: Container) => T;

type Registration<T> = {

    singleton: boolean;

    factory: Factory<T>;

};

export class Container {

    private readonly registrations =

        new Map<string, Registration<unknown>>();

    private readonly singletons =

        new Map<string, unknown>();

    /**
     * Register Singleton
     */

    public singleton<T>(

        token: string,

        factory: Factory<T>

    ): void {

        if (this.registrations.has(token)) {

            throw new Error(

                `Dependency already registered: ${token}`

            );

        }

        this.registrations.set(

            token,

            {

                singleton: true,

                factory

            }

        );

    }

    /**
     * Register Transient
     */

    public transient<T>(

        token: string,

        factory: Factory<T>

    ): void {

        if (this.registrations.has(token)) {

            throw new Error(

                `Dependency already registered: ${token}`

            );

        }

        this.registrations.set(

            token,

            {

                singleton: false,

                factory

            }

        );

    }

    /**
     * Resolve Dependency
     */

    public resolve<T>(

        token: string

    ): T {

        if (this.singletons.has(token)) {

            return this.singletons.get(token) as T;

        }

        const registration =

            this.registrations.get(token);

        if (!registration) {

            throw new Error(

                `Dependency not registered: ${token}`

            );

        }

        const instance =

            registration.factory(this);

        if (registration.singleton) {

            this.singletons.set(

                token,

                instance

            );

        }

        return instance as T;

    }

    /**
     * Check Registration
     */

    public has(

        token: string

    ): boolean {

        return this.registrations.has(token);

    }

    /**
     * Remove Singleton Cache
     */

    public remove(

        token: string

    ): void {

        this.singletons.delete(token);

        this.registrations.delete(token);

    }

    /**
     * Clear Everything
     */

    public clear(): void {

        this.singletons.clear();

        this.registrations.clear();

    }

    /**
     * Registered Tokens
     */

    public tokens(): string[] {

        return [

            ...this.registrations.keys()

        ];

    }

    /**
     * Number of Registrations
     */

    public size(): number {

        return this.registrations.size;

    }

}

const container = new Container();

export default container;

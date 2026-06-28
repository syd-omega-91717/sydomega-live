// ============================================================================
// FILE: /backend/src/platform/container/container.ts
// NEW FILE
// ============================================================================

export type Factory<T> = () => T;

export class Container {

    private readonly singletons = new Map<string, unknown>();

    private readonly factories = new Map<string, Factory<unknown>>();

    public singleton<T>(

        key: string,

        factory: Factory<T>

    ): void {

        this.factories.set(

            key,

            factory

        );

    }

    public resolve<T>(

        key: string

    ): T {

        if (

            this.singletons.has(key)

        ) {

            return this.singletons.get(

                key

            ) as T;

        }

        const factory = this.factories.get(

            key

        );

        if (!factory) {

            throw new Error(

                `Dependency '${key}' is not registered.`

            );

        }

        const instance = factory();

        this.singletons.set(

            key,

            instance

        );

        return instance as T;

    }

    public has(

        key: string

    ): boolean {

        return this.factories.has(key);

    }

    public clear(): void {

        this.singletons.clear();

        this.factories.clear();

    }

}

export default new Container();

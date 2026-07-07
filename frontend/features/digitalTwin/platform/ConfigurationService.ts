// ============================================================================
// FILE:
// /frontend/features/digitalTwin/platform/ConfigurationService.ts
// ============================================================================

export class ConfigurationService{

    private values=

    new Map<string,unknown>();

    set(

        key:string,

        value:unknown

    ){

        this.values.set(

            key,

            value

        );

    }

    get<T>(

        key:string

    ){

        return this.values.get(

            key

        ) as T;

    }

}

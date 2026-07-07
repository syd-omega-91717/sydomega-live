// ============================================================================
// FILE:
// /core/security/ConfigurationValidationShield.ts
// ============================================================================

export class ConfigurationValidationShield{

    validate(

        configuration:unknown

    ){

        return{

            valid:true,

            configuration

        };

    }

}

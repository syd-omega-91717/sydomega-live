// ============================================================================
// FILE: /backend/src/modules/saml/infrastructure/services/xml-signature-validator.ts
// NEW FILE
// ============================================================================

export interface XmlSignatureValidator {

    validate(

        xml: string

    ): Promise<boolean>;

}

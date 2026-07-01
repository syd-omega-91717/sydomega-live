// ============================================================================
// FILE: /backend/src/modules/authorization/domain/enums/conditional-access-condition.ts
// NEW FILE
// ============================================================================

export enum ConditionalAccessCondition{

    User="USER",

    Group="GROUP",

    Role="ROLE",

    Device="DEVICE",

    Country="COUNTRY",

    IpRange="IP_RANGE",

    Application="APPLICATION",

    RiskLevel="RISK_LEVEL",

    TimeWindow="TIME_WINDOW"

}

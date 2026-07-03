// ============================================================================
// FILE: /backend/src/modules/notification/infrastructure/providers/provider.config.ts
// NEW FILE
// ============================================================================

export const NotificationProviders={

    email:"SMTP/SES",

    sms:"Twilio",

    push:"FCM/APNS",

    websocket:true,

    webhook:true,

    retryAttempts:5

};

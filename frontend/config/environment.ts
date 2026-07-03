// ============================================================================
// FILE:
// /frontend/config/environment.ts
// ============================================================================

export interface EnvironmentConfiguration {

    appName: string;

    appVersion: string;

    gatewayUrl: string;

    websocketUrl: string;

    aiGateway: string;

    gisGateway: string;

    blockchainGateway: string;

    notificationGateway: string;

    environment: "development" | "staging" | "production";

}

const configuration: EnvironmentConfiguration = {

    appName: "Ω SYD OMEGA 91717",

    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",

    gatewayUrl:
        process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080",

    websocketUrl:
        process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/events",

    aiGateway:
        process.env.NEXT_PUBLIC_AI_GATEWAY ?? "/ai",

    gisGateway:
        process.env.NEXT_PUBLIC_GIS_GATEWAY ?? "/gis",

    blockchainGateway:
        process.env.NEXT_PUBLIC_BLOCKCHAIN_GATEWAY ?? "/blockchain",

    notificationGateway:
        process.env.NEXT_PUBLIC_NOTIFICATION_GATEWAY ?? "/notifications",

    environment:
        (process.env.NEXT_PUBLIC_ENVIRONMENT as any) ?? "development"

};

export default configuration;

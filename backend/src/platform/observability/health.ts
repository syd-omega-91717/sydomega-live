// ============================================================================
// FILE: /backend/src/platform/observability/health.ts
// NEW FILE
// ============================================================================

export interface HealthCheck {

    component: string;

    status: "UP" | "DOWN";

    message?: string;

}

class HealthManager {

    private readonly checks: HealthCheck[] = [];

    public register(

        check: HealthCheck

    ) {

        this.checks.push(check);

    }

    public report() {

        return {

            status:

                this.checks.every(

                    c => c.status === "UP"

                )

                    ? "UP"

                    : "DOWN",

            timestamp:

                new Date(),

            checks:

                this.checks

        };

    }

}

export default new HealthManager();

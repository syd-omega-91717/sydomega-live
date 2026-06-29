// ============================================================================
// FILE: /backend/src/kernel/scheduler/scheduler.ts
// NEW FILE
// ============================================================================

import { Schedule } from "./schedule.js";
import { ScheduledJob } from "./scheduled-job.js";

export class Scheduler {

    private readonly jobs =

        new Map<string, ScheduledJob>();

    register(

        schedule: Schedule,

        job: ScheduledJob

    ): void {

        this.jobs.set(

            schedule.id,

            job

        );

    }

    async trigger(

        scheduleId: string

    ): Promise<void> {

        const job =

            this.jobs.get(scheduleId);

        if (!job) {

            throw new Error(

                `Schedule '${scheduleId}' not registered.`

            );

        }

        await job.execute();

    }

}

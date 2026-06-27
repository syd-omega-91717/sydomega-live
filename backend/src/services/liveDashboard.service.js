// ============================================================================
// FILE: /backend/src/services/liveDashboard.service.js
// REPLACE ENTIRE FILE
// ============================================================================

import { supabase } from "../database/supabase.js";
import * as Analytics from "./analytics.service.js";
import * as Health from "./systemHealth.service.js";
import * as Events from "./event.service.js";

export async function snapshot() {

    const [

        analytics,

        health,

        metrics,

        latest

    ] = await Promise.all([

        Analytics.overview(),

        Health.health(),

        Events.dashboardMetrics(),

        Events.latest(50)

    ]);

    return {

        timestamp: new Date(),

        analytics,

        health,

        metrics,

        latest

    };

}

export async function founderPanel() {

    const [

        snapshot,

        timeline

    ] = await Promise.all([

        snapshot(),

        Events.timeline(200)

    ]);

    return {

        ...snapshot,

        timeline

    };

}

// ============================================================================
// FILE:
// /frontend/app/dashboard/page.tsx
// UPDATED
// ============================================================================

import DashboardGrid
from "@/components/dashboard/DashboardGrid";

import SystemHealthWidget
from "@/components/dashboard/SystemHealthWidget";

import StatisticsWidget
from "@/components/dashboard/StatisticsWidget";

import AlertWidget
from "@/components/dashboard/AlertWidget";

import RecentActivityWidget
from "@/components/dashboard/RecentActivityWidget";

export default function DashboardPage(){

    return(

        <main>

            <h1>

                Ω Enterprise Dashboard

            </h1>

            <DashboardGrid>

                <SystemHealthWidget/>

                <StatisticsWidget/>

                <AlertWidget/>

                <RecentActivityWidget/>

            </DashboardGrid>

        </main>

    );

}

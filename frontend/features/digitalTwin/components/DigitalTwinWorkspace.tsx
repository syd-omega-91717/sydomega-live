// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import GISPanel from "./GISPanel";
import IoTDashboard from "./IoTDashboard";
import IndustrialAutomationDashboard from "./IndustrialAutomationDashboard";
import PhysicsSimulationDashboard from "./PhysicsSimulationDashboard";
import AIAutonomousDashboard from "./AIAutonomousDashboard";
import SecurityDashboard from "./SecurityDashboard";
import AnalyticsDashboard from "./AnalyticsDashboard";
import CommandCenterDashboard from "./CommandCenterDashboard";
import InfrastructureDashboard from "./InfrastructureDashboard";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            {/* DT-001 → DT-024 */}

            <GISPanel/>

            <IoTDashboard/>

            <IndustrialAutomationDashboard/>

            <PhysicsSimulationDashboard/>

            <AIAutonomousDashboard/>

            <SecurityDashboard/>

            <AnalyticsDashboard/>

            <CommandCenterDashboard/>

            <InfrastructureDashboard/>

        </main>

    );

}

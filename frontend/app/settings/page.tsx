// ============================================================================
// FILE:
// /frontend/app/settings/page.tsx
// ============================================================================

'use client';

import GeneralSettings from "@/features/settings/components/GeneralSettings";
import AppearanceSettings from "@/features/settings/components/AppearanceSettings";
import SecuritySettings from "@/features/settings/components/SecuritySettings";
import LocalizationSettings from "@/features/settings/components/LocalizationSettings";
import NotificationSettings from "@/features/settings/components/NotificationSettings";

export default function SettingsPage(){

    return(

        <main>

            <h1>Enterprise Settings</h1>

            <GeneralSettings/>

            <AppearanceSettings/>

            <SecuritySettings/>

            <LocalizationSettings/>

            <NotificationSettings/>

        </main>

    );

}

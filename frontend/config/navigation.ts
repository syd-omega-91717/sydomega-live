// ============================================================================
// FILE:
// /frontend/config/navigation.ts
// ============================================================================

import {
    Cpu,
    Globe,
    Wallet,
    BrainCircuit,
    LayoutDashboard,
    Settings,
    Shield,
    Database
} from "lucide-react";

export interface NavigationItem {

    label: string;

    href: string;

    icon: any;

}

export const Navigation: NavigationItem[] = [

    {

        label: "Dashboard",

        href: "/dashboard",

        icon: LayoutDashboard

    },

    {

        label: "Artificial Intelligence",

        href: "/ai",

        icon: BrainCircuit

    },

    {

        label: "Digital Twin",

        href: "/digital-twin",

        icon: Cpu

    },

    {

        label: "GIS",

        href: "/gis",

        icon: Globe

    },

    {

        label: "Blockchain",

        href: "/blockchain",

        icon: Wallet

    },

    {

        label: "Storage",

        href: "/storage",

        icon: Database

    },

    {

        label: "Security",

        href: "/security",

        icon: Shield

    },

    {

        label: "Settings",

        href: "/settings",

        icon: Settings

    }

];

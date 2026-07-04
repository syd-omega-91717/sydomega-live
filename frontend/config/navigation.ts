// ============================================================================
// FILE:
// /frontend/config/navigation.ts
// ============================================================================

import { NavigationItem } from "@/types/navigation";

export const navigation:NavigationItem[]=[

{
    id:"dashboard",
    title:"Dashboard",
    icon:"dashboard",
    path:"/dashboard"
},
{
    id:"ai",
    title:"Artificial Intelligence",
    icon:"psychology",
    path:"/ai"
},
{
    id:"digitalTwin",
    title:"Digital Twin",
    icon:"hub",
    path:"/digital-twin"
},
{
    id:"gis",
    title:"GIS",
    icon:"map",
    path:"/gis"
},
{
    id:"iot",
    title:"IoT",
    icon:"memory",
    path:"/iot"
},
{
    id:"blockchain",
    title:"Blockchain",
    icon:"token",
    path:"/blockchain"
},
{
    id:"analytics",
    title:"Analytics",
    icon:"analytics",
    path:"/analytics"
},
{
    id:"settings",
    title:"Settings",
    icon:"settings",
    path:"/settings"
}

];

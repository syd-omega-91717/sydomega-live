// ============================================================================
// FILE:
// /frontend/components/layout/Sidebar.tsx
// ============================================================================

'use client';

import Link from "next/link";

export default function Sidebar(){

    return (

        <aside style={{
            width:260,
            height:"100vh",
            borderRight:"1px solid #ddd",
            padding:20
        }}>

            <h2>Ω SYD</h2>

            <nav style={{display:"flex", flexDirection:"column", gap:10}}>

                <Link href="/dashboard">Dashboard</Link>

                <Link href="/ai">AI Assistant</Link>

                <Link href="/digital-twin">Digital Twin</Link>

                <Link href="/gis">GIS</Link>

                <Link href="/iot">IoT</Link>

                <Link href="/blockchain">Blockchain</Link>

                <Link href="/analytics">Analytics</Link>

                <Link href="/settings">Settings</Link>

            </nav>

        </aside>

    );

}

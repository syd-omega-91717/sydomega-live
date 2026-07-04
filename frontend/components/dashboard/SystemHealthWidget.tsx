// ============================================================================
// FILE:
// /frontend/components/dashboard/SystemHealthWidget.tsx
// ============================================================================

'use client';

import Widget from "./Widget";

interface Props {

    cpu: number;

    memory: number;

    storage: number;

    uptime: string;

}

export default function SystemHealthWidget({

    cpu,

    memory,

    storage,

    uptime

}: Props) {

    return (

        <Widget

            title="System Health"

            subtitle="Infrastructure"

        >

            <p>CPU: {cpu}%</p>

            <p>Memory: {memory}%</p>

            <p>Storage: {storage}%</p>

            <p>Uptime: {uptime}</p>

        </Widget>

    );

}

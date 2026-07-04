// ============================================================================
// FILE:
// /frontend/components/dashboard/RecentActivityWidget.tsx
// ============================================================================

'use client';

import Widget from "./Widget";

export interface Activity {

    id: string;

    title: string;

    timestamp: string;

}

interface Props {

    activities: Activity[];

}

export default function RecentActivityWidget({

    activities

}: Props) {

    return (

        <Widget

            title="Recent Activity"

        >

            <ul>

                {

                    activities.map(activity => (

                        <li key={activity.id}>

                            <strong>

                                {activity.title}

                            </strong>

                            <br />

                            <small>

                                {activity.timestamp}

                            </small>

                        </li>

                    ))

                }

            </ul>

        </Widget>

    );

}

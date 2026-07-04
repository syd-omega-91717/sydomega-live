// ============================================================================
// FILE:
// /frontend/components/realtime/LiveFeed.tsx
// ============================================================================

'use client';

import { useState } from "react";

import { useRealtimeEvent } from "@/hooks/useRealtimeEvent";

interface FeedItem {

    id: string;

    message: string;

    timestamp: string;

}

export default function LiveFeed(){

    const [items,setItems] = useState<FeedItem[]>([]);

    useRealtimeEvent<FeedItem>("NOTIFICATION",(payload)=>{

        setItems(prev => [payload,...prev]);

    });

    return(

        <section>

            <h3>Live Feed</h3>

            <ul>

                {

                    items.map(item=>(

                        <li key={item.id}>

                            {item.message}

                        </li>

                    ))

                }

            </ul>

        </section>

    );

}

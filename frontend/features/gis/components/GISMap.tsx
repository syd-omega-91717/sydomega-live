// ============================================================================
// FILE:
// /frontend/features/gis/components/GISMap.tsx
// ============================================================================

'use client';

import Card from "@/components/ui/Card";

export default function GISMap(){

    return(

        <Card title="Enterprise GIS">

            <div
                id="map"
                style={{
                    width:"100%",
                    height:700,
                    background:"#ececec"
                }}
            />

        </Card>

    );

}

// ============================================================================
// FILE:
// /frontend/app/gis/page.tsx
// UPDATED
// ============================================================================

'use client';

import MapContainer
from "@/features/gis/components/MapContainer";

import LayerManager
from "@/features/gis/components/LayerManager";

import MapToolbar
from "@/features/gis/components/MapToolbar";

import SearchPanel
from "@/features/gis/components/SearchPanel";

import CoordinateDisplay
from "@/features/gis/components/CoordinateDisplay";

import FeatureInspector
from "@/features/gis/components/FeatureInspector";

import MapLegend
from "@/features/gis/components/MapLegend";

export default function GISPage(){

    return(

        <main>

            <h1>

                Enterprise GIS Platform

            </h1>

            <MapToolbar/>

            <SearchPanel/>

            <LayerManager/>

            <MapContainer/>

            <CoordinateDisplay/>

            <FeatureInspector/>

            <MapLegend/>

        </main>

    );

}

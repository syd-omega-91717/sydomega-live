// ============================================================================
// FILE:
// /frontend/app/gis/page.tsx
// UPDATED
// ============================================================================

'use client';

import {MapStateProvider}
from "@/features/gis/components/MapStateProvider";

import MapContainer
from "@/features/gis/components/MapContainer";

import LayerManager
from "@/features/gis/components/LayerManager";

import DrawingTools
from "@/features/gis/components/DrawingTools";

import MeasurementTools
from "@/features/gis/components/MeasurementTools";

import GeofenceEditor
from "@/features/gis/components/GeofenceEditor";

import RoutePlanner
from "@/features/gis/components/RoutePlanner";

import HeatmapLayer
from "@/features/gis/components/HeatmapLayer";

import ReplayTimeline
from "@/features/gis/components/ReplayTimeline";

import SpatialAnalysisPanel
from "@/features/gis/components/SpatialAnalysisPanel";

import ImportExportPanel
from "@/features/gis/components/ImportExportPanel";

export default function GISPage(){

return(

<MapStateProvider>

<main>

<h1>

Enterprise GIS Workspace

</h1>

<LayerManager/>

<DrawingTools/>

<MeasurementTools/>

<GeofenceEditor/>

<RoutePlanner/>

<HeatmapLayer/>

<MapContainer/>

<ReplayTimeline/>

<SpatialAnalysisPanel/>

<ImportExportPanel/>

</main>

</MapStateProvider>

);

}

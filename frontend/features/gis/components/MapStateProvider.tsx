// ============================================================================
// FILE:
// /frontend/features/gis/components/MapStateProvider.tsx
// ============================================================================

'use client';

import {createContext,useContext,useState} from "react";

const MapStateContext=createContext<any>(null);

export function MapStateProvider({

children

}:{children:any}){

const [zoom,setZoom]=useState(8);

const [center,setCenter]=useState({

lat:0,

lng:0

});

return(

<MapStateContext.Provider

value={{

zoom,

center,

setZoom,

setCenter

}}

>

{children}

</MapStateContext.Provider>

);

}

export function useMapState(){

return useContext(

MapStateContext

);

}

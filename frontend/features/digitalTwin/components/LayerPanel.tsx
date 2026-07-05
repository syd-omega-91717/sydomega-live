// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/LayerPanel.tsx
// ============================================================================

'use client';

import {

useLayerStore

}

from "../store/layerStore";

export default function LayerPanel(){

    const{

        layers,

        toggle

    }=

    useLayerStore();

    return(

        <section>

            <h3>

                Layers

            </h3>

            {

                layers.map(layer=>(

                    <label

                        key={layer.id}

                    >

                        <input

                            type="checkbox"

                            checked={layer.visible}

                            onChange={()=>

                                toggle(

                                    layer.id

                                )

                            }

                        />

                        {layer.id}

                    </label>

                ))

            }

        </section>

    );

}

// ============================================================================
// FILE:
// /frontend/components/search/CommandPalette.tsx
// ============================================================================

'use client';

import { useState }

from "react";

export default function CommandPalette(){

    const[open,setOpen]=

        useState(false);

    return(

        <>

        {

            open

            &&

            <div

                className="omega-command"

            >

                Command Palette

            </div>

        }

        </>

    );

}

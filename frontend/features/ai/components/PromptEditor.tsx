// ============================================================================
// FILE:
// /frontend/features/ai/components/PromptEditor.tsx
// ============================================================================

'use client';

import {useState} from "react";

import EnterpriseButton

from "@/components/ui/Button";

export default function PromptEditor(){

    const[prompt,setPrompt]=

        useState("");

    return(

        <section>

            <textarea

                value={prompt}

                onChange={

                    e=>setPrompt(

                        e.target.value

                    )

                }

            />

            <EnterpriseButton>

                Send

            </EnterpriseButton>

        </section>

    );

}

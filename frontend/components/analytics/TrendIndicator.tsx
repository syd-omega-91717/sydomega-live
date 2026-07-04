// ============================================================================
// FILE:
// /frontend/components/analytics/TrendIndicator.tsx
// ============================================================================

'use client';

interface Props{

    value:number;

}

export default function TrendIndicator({

    value

}:Props){

    const positive = value >= 0;

    return(

        <span

            style={{

                color:

                    positive

                        ? "#16a34a"

                        : "#dc2626",

                fontWeight:600

            }}

        >

            {

                positive

                    ? "▲"

                    : "▼"

            }

            {" "}

            {Math.abs(value)}%

        </span>

    );

}

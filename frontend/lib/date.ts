// ============================================================================
// FILE:
// /frontend/lib/date.ts
// ============================================================================

export function formatDate(

    value:string

){

    return new Intl.DateTimeFormat(

        "en-US",

        {

            dateStyle:"medium",

            timeStyle:"short"

        }

    ).format(

        new Date(value)

    );

}

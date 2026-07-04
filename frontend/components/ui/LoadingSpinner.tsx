// ============================================================================
// FILE:
// /frontend/components/ui/LoadingSpinner.tsx
// ============================================================================

interface Props {

    message?: string;

}

export default function LoadingSpinner({

    message = "Loading..."

}: Props) {

    return (

        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 240
            }}
        >

            <span>{message}</span>

        </div>

    );

}

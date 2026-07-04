// ============================================================================
// FILE:
// /frontend/components/ui/EmptyState.tsx
// ============================================================================

interface Props {

    title: string;

    description: string;

}

export default function EmptyState({

    title,

    description

}: Props) {

    return (

        <section
            style={{
                textAlign: "center",
                padding: 48
            }}
        >

            <h2>{title}</h2>

            <p>{description}</p>

        </section>

    );

}

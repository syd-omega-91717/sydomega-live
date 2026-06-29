// ============================================================================
// FILE: /backend/src/modules/organization/domain/aggregates/aggregate-root.ts
// NEW FILE
// ============================================================================

export abstract class AggregateRoot {

    private readonly domainEvents = [];

    protected addEvent(

        event: unknown

    ) {

        this.domainEvents.push(

            event

        );

    }

    public pullEvents() {

        const events =

            [...this.domainEvents];

        this.domainEvents.length = 0;

        return events;

    }

}

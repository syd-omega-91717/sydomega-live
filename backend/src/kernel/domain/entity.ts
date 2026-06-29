// ============================================================================
// FILE: /backend/src/kernel/domain/entity.ts
// NEW FILE
// ============================================================================

export abstract class Entity<TId> {

    protected constructor(

        public readonly id:TId

    ){}

    equals(

        other:Entity<TId>

    ):boolean{

        return this.id===other.id;

    }

}

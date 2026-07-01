// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/secret.repository.ts
// NEW FILE
// ============================================================================

import { SecretAggregate }
from "../../domain/aggregates/secret.aggregate";

export interface SecretRepository{

    save(

        aggregate:SecretAggregate

    ):Promise<void>;

    find(

        secretId:string

    ):Promise<SecretAggregate|null>;

    active(

    ):Promise<SecretAggregate[]>;

}

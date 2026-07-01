// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-certification.ts
// NEW FILE
// ============================================================================

import { AccessCertificationId }
from "../value-objects/access-certification-id";

import { CertificationStatus }
from "../enums/certification-status";

import { CertificationItem }
from "./certification-item";

export class AccessCertification{

    constructor(

        readonly id:AccessCertificationId,

        readonly name:string,

        readonly status:CertificationStatus,

        readonly startedAt:Date,

        readonly dueAt:Date,

        readonly items:CertificationItem[]

    ){}

}

// ============================================================================
// FILE: /backend/src/modules/organization/presentation/validators/create-organization.validator.ts
// NEW FILE
// ============================================================================

import { z }

from "zod";

export const CreateOrganizationValidator =

z.object({

    name:

        z.string()

        .min(3)

        .max(120),

    slug:

        z.string()

        .min(3)

        .max(64),

    type:

        z.string()

        .optional(),

    description:

        z.string()

        .optional(),

    website:

        z.string()

        .url()

        .optional(),

    logoUrl:

        z.string()

        .url()

        .optional()

});

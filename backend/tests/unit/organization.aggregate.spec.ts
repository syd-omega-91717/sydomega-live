// ============================================================================
// FILE: /backend/tests/unit/organization.aggregate.spec.ts
// NEW FILE
// ============================================================================

import { describe, expect, it } from "vitest";

import { OrganizationFactory }

from "../../src/modules/organization/domain/factories/organization.factory.js";

describe(

    "OrganizationAggregate",

    ()=>{

        it(

            "creates organization",

            ()=>{

                const aggregate=

                    OrganizationFactory.create({

                        ownerId:"owner",

                        name:"Acme",

                        slug:"acme"

                    });

                expect(

                    aggregate.organization.name

                ).toBe(

                    "Acme"

                );

            }

        );

    }

);

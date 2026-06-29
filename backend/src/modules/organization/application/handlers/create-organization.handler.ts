// ============================================================================
// FILE: /backend/src/modules/organization/application/handlers/create-organization.handler.ts
// NEW FILE
// ============================================================================

import { CreateOrganizationCommand }
from "../commands/create-organization.command.js";

import { OrganizationRepository }
from "../../domain/repositories/organization.repository.js";

import { OrganizationFactory }
from "../../domain/factories/organization.factory.js";

export class CreateOrganizationHandler {

    constructor(

        private readonly repository: OrganizationRepository

    ) {}

    async execute(

        command: CreateOrganizationCommand

    ) {

        const aggregate =

            OrganizationFactory.create({

                ownerId: command.ownerId,

                name: command.name,

                slug: command.slug,

                type: command.type,

                description: command.description,

                website: command.website,

                logoUrl: command.logoUrl

            });

        await this.repository.save(

            aggregate

        );

        return aggregate.organization.id;

    }

}

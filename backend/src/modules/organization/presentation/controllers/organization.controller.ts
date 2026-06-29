// ============================================================================
// FILE: /backend/src/modules/organization/presentation/controllers/organization.controller.ts
// NEW FILE
// ============================================================================

import { Request, Response } from "express";

import { OrganizationCommandService }
from "../../application/services/organization-command.service.js";

import { OrganizationQueryService }
from "../../application/services/organization-query.service.js";

export class OrganizationController {

    constructor(

        private readonly commands: OrganizationCommandService,

        private readonly queries: OrganizationQueryService

    ) {}

    async create(

        req: Request,

        res: Response

    ) {

        const id = await this.commands.createOrganization.execute({

            ownerId: req.user.id,

            ...req.body

        });

        return res.status(201).json({

            success: true,

            organizationId: id

        });

    }

    async overview(

        req: Request,

        res: Response

    ) {

        const overview =

            await this.queries.overview(

                req.params.id

            );

        return res.json(

            overview

        );

    }

    async statistics(

        req: Request,

        res: Response

    ) {

        const statistics =

            await this.queries.statistics(

                req.params.id

            );

        return res.json(

            statistics

        );

    }

}

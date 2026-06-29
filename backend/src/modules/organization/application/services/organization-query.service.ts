// ============================================================================
// FILE: /backend/src/modules/organization/application/services/organization-query.service.ts
// NEW FILE
// ============================================================================

import { QueryBus }
from "../query-bus/query-bus.js";

export class OrganizationQueryService{

    constructor(

        private readonly queryBus:QueryBus

    ){}

    overview(

        organizationId:string

    ){

        return this.queryBus.execute({

            constructor:{

                name:"GetOrganizationOverviewQuery"

            },

            organizationId

        });

    }

    statistics(

        organizationId:string

    ){

        return this.queryBus.execute({

            constructor:{

                name:"GetOrganizationStatisticsQuery"

            },

            organizationId

        });

    }

}

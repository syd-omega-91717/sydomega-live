// ============================================================================
// FILE: /backend/src/modules/approval/index.ts
// NEW FILE
// ============================================================================

import routes from "./approval.routes.js";

import {

    registerApprovalEvents

} from "./approval.events.js";

export {

    routes,

    registerApprovalEvents

};

export { default as ApprovalController }

from "./approval.controller.js";

export { default as ApprovalService }

from "./approval.service.js";

export { default as ApprovalRepository }

from "./approval.repository.js";

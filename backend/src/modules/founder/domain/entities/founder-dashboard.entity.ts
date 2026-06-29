// ============================================================================
// FILE: /backend/src/modules/founder/domain/entities/founder-dashboard.entity.ts
// NEW FILE
// ============================================================================

export class FounderDashboard {

    constructor(

        public pendingApprovals: number,

        public approvedUsers: number,

        public rejectedUsers: number,

        public activeUsers: number,

        public onlineUsers: number,

        public aiRequests: number,

        public academyStudents: number,

        public consultancyProjects: number,

        public publishedAssets: number,

        public notifications: number,

        public systemHealth: string,

        public cpuUsage: number,

        public memoryUsage: number,

        public storageUsage: number,

        public uptime: number

    ) {}

}

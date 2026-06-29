// ============================================================================
// FILE: /backend/src/modules/founder/domain/entities/widget.entity.ts
// NEW FILE
// ============================================================================

export class Widget {

    constructor(

        public readonly id: string,

        public readonly name: string,

        public readonly title: string,

        public readonly description: string,

        public readonly category: string,

        public readonly endpoint: string,

        public readonly websocketChannel: string,

        public readonly refreshInterval: number,

        public readonly cacheSeconds: number,

        public readonly permissions: string[],

        public readonly enabled: boolean

    ) {}

}

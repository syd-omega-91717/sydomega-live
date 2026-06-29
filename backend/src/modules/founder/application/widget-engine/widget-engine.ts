// ============================================================================
// FILE: /backend/src/modules/founder/application/widget-engine/widget-engine.ts
// NEW FILE
// ============================================================================

import type {

    FounderWidget

}

from "../../domain/widgets/widget.interface.js";

export class WidgetEngine {

    private readonly widgets =

        new Map<

            string,

            FounderWidget

        >();

    register(

        widget: FounderWidget

    ) {

        this.widgets.set(

            widget.id,

            widget

        );

    }

    async load(

        id: string

    ) {

        const widget =

            this.widgets.get(id);

        if (!widget)

            throw new Error(

                "Widget not found."

            );

        return widget.load();

    }

    list() {

        return [

            ...this.widgets.values()

        ];

    }

}

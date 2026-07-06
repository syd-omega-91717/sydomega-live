// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/StreamingIngestion.ts
// ============================================================================

export class StreamingIngestion{

    private queue:unknown[]=[];

    ingest(packet:unknown){

        this.queue.push(packet);

    }

    flush(){

        const copy=[

            ...this.queue

        ];

        this.queue=[];

        return copy;

    }

}

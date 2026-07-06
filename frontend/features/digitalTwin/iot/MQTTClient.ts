// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/MQTTClient.ts
// ============================================================================

export class MQTTClient{

    connect(url:string){

        console.log(

            "MQTT Connected:",

            url

        );

    }

    subscribe(topic:string){

        console.log(

            "Subscribe:",

            topic

        );

    }

    publish(

        topic:string,

        payload:string

    ){

        console.log(

            topic,

            payload

        );

    }

    disconnect(){}

}

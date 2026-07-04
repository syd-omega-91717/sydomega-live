// ============================================================================
// FILE:
// /frontend/services/aiService.ts
// ============================================================================

import { apiClient } from "@/services/apiClient";

export default class AIService{

    static async conversations(){

        return (await apiClient.get(

            "/ai/conversations"

        )).data;

    }

    static async conversation(

        id:string

    ){

        return (await apiClient.get(

            `/ai/conversations/${id}`

        )).data;

    }

    static async send(

        conversationId:string,

        prompt:string

    ){

        return (await apiClient.post(

            "/ai/chat",

            {

                conversationId,

                prompt

            }

        )).data;

    }

    static async models(){

        return (await apiClient.get(

            "/ai/models"

        )).data;

    }

}

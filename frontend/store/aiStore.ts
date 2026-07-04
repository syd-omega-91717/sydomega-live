// ============================================================================
// FILE:
// /frontend/store/aiStore.ts
// ============================================================================

import {create} from "zustand";

export const useAIStore=create(

(set)=>({

conversations:[],

messages:[],

models:[],

activeConversation:null,

setConversations:(conversations:any)=>set({

conversations

}),

setMessages:(messages:any)=>set({

messages

}),

setModels:(models:any)=>set({

models

}),

setActiveConversation:(id:string)=>set({

activeConversation:id

})

})

);

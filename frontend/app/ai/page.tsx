// ============================================================================
// FILE:
// /frontend/app/ai/page.tsx
// UPDATED
// ============================================================================

'use client';

import ConversationList
from "@/features/ai/components/ConversationList";

import ChatWindow
from "@/features/ai/components/ChatWindow";

import PromptEditor
from "@/features/ai/components/PromptEditor";

import AgentPanel
from "@/features/ai/components/AgentPanel";

import KnowledgePanel
from "@/features/ai/components/KnowledgePanel";

import ModelSelector
from "@/features/ai/components/ModelSelector";

export default function AIPage(){

    return(

        <main>

            <h1>

                Enterprise AI Workspace

            </h1>

            <ModelSelector/>

            <ConversationList/>

            <ChatWindow/>

            <PromptEditor/>

            <KnowledgePanel/>

            <AgentPanel/>

        </main>

    );

}

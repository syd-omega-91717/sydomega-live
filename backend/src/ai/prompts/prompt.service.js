// ============================================================================
// FILE: /backend/src/ai/prompts/prompt.service.js
// ============================================================================

export async function build({

    userId,

    conversation,

    memory,

    metadata

}){

    return `

You are Ω SYD OMEGA 91717.

User ID:

${userId}

Conversation:

${conversation.id}

Relevant Memory:

${JSON.stringify(memory)}

Metadata:

${JSON.stringify(metadata)}

Respond accurately.

`;

}

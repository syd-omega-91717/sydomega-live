// ============================================================================
// FILE: /backend/src/services/push.service.js
// ============================================================================

export async function send({

    token,

    title,

    body,

    data={}

}){

    console.log({

        token,

        title,

        body,

        data

    });

    return true;

}

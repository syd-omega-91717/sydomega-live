// ============================================================================
// FILE: /backend/src/services/email.service.js
// ============================================================================

export async function send({

    to,

    subject,

    html,

    text

}){

    // SMTP / SendGrid / SES implementation

    console.log({

        to,

        subject

    });

    return true;

}

export async function approvalApproved(email){

    return send({

        to:email,

        subject:"Ω Account Approved",

        html:"Your account has been approved."

    });

}

export async function approvalRejected(email){

    return send({

        to:email,

        subject:"Ω Account Rejected",

        html:"Your account was rejected."

    });

}

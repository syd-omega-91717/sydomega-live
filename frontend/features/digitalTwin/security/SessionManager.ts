// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/SessionManager.ts
// ============================================================================

export interface TwinSession{

    id:string;

    userId:string;

    createdAt:number;

    expiresAt:number;

}

export class SessionManager{

    private sessions=

    new Map<string,TwinSession>();

    create(userId:string){

        const session={

            id:crypto.randomUUID(),

            userId,

            createdAt:Date.now(),

            expiresAt:

            Date.now()+3600000

        };

        this.sessions.set(

            session.id,

            session

        );

        return session;

    }

    validate(id:string){

        const session=

        this.sessions.get(id);

        return !!session &&

        session.expiresAt>Date.now();

    }

}

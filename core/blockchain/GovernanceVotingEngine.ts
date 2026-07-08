// ============================================================================
// FILE:
// /core/blockchain/GovernanceVotingEngine.ts
// ============================================================================

export class GovernanceVotingEngine{

    vote(

        proposal:string,

        wallet:string,

        decision:boolean

    ){

        return{

            proposal,

            wallet,

            decision

        };

    }

}

// ============================================================================
// FILE:
// /enterprise/healthcare/HospitalInformationSystemEngine.ts
// ============================================================================

export class HospitalInformationSystemEngine{

    admit(

        patientId:string

    ){

        return{

            patientId,

            admitted:true

        };

    }

}

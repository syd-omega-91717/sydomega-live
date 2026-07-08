// ============================================================================
// FILE:
// /core/academy/AcademyLesson.ts
// ============================================================================

export interface AcademyLesson{

    id:string;

    courseId:string;

    title:string;

    order:number;

    duration:number;

    videoUrl:string;

    attachments:string[];

}

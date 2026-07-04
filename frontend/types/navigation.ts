// ============================================================================
// FILE:
// /frontend/types/navigation.ts
// ============================================================================

export interface NavigationItem{

    id:string;

    title:string;

    icon:string;

    path:string;

    children?:NavigationItem[];

    permissions?:string[];

    hidden?:boolean;

}

// ============================================================================
// FILE:
// /frontend/types/auth.ts
// ============================================================================

export interface UserProfile{

    id:string;

    username:string;

    email:string;

    firstName:string;

    lastName:string;

    avatar?:string;

    roles:string[];

    permissions:string[];

}

export interface LoginRequest{

    username:string;

    password:string;

}

export interface LoginResponse{

    accessToken:string;

    refreshToken:string;

    expires:number;

    profile:UserProfile;

}

export interface RefreshResponse{

    accessToken:string;

    expires:number;

}

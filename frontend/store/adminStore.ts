// ============================================================================
// FILE:
// /frontend/store/adminStore.ts
// ============================================================================

import {create} from "zustand";

export const useAdminStore=create(

(set)=>({

users:[],

roles:[],

organizations:[],

setUsers:(users:any[])=>set({users}),

setRoles:(roles:any[])=>set({roles}),

setOrganizations:(organizations:any[])=>set({organizations})

})

);

import { supabase } from "../database/supabase";

export interface Permission {

    resource: string;

    action: string;

}

export async function getUserPermissions(userId: string) {

    const { data: member } = await supabase

        .from("organization_members")

        .select("role_id")

        .eq("profile_id", userId);

    if (!member?.length) return [];

    const roleIds = member.map(r => r.role_id);

    const { data } = await supabase

        .from("role_permissions")

        .select(`
            permissions(
                resource,
                action
            )
        `)
        .in("role_id", roleIds);

    return data ?? [];

}

export async function hasPermission(

    userId: string,

    resource: string,

    action: string

) {

    const permissions = await getUserPermissions(userId);

    return permissions.some((row: any) =>

        row.permissions?.resource === resource &&

        row.permissions?.action === action

    );

}

// ============================================================================
// FILE:
// /frontend/services/http/request.ts
// ============================================================================

import httpClient from "./httpClient";

export async function get<T>(url: string): Promise<T> {

    const response = await httpClient.get<T>(url);

    return response.data;

}

export async function post<T>(
    url: string,
    body: unknown
): Promise<T> {

    const response = await httpClient.post<T>(url, body);

    return response.data;

}

export async function put<T>(
    url: string,
    body: unknown
): Promise<T> {

    const response = await httpClient.put<T>(url, body);

    return response.data;

}

export async function del<T>(
    url: string
): Promise<T> {

    const response = await httpClient.delete<T>(url);

    return response.data;

}

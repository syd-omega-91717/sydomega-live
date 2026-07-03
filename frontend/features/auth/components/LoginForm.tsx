// ============================================================================
// FILE:
// /frontend/features/auth/components/LoginForm.tsx
// ============================================================================

'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import { apiClient } from "@/services/apiClient";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginForm() {

    const router = useRouter();

    const { setUser } = useAuth();

    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);

    async function login() {

        try {

            setLoading(true);

            const response = await apiClient.post(
                "/identity/login",
                {
                    email,
                    password
                }
            );

            localStorage.setItem(
                "access_token",
                response.data.accessToken
            );

            setUser(response.data.user);

            router.push("/dashboard");

        } finally {

            setLoading(false);

        }

    }

    return (

        <div style={{ maxWidth: 420 }}>

            <h1>Enterprise Login</h1>

            <input
                placeholder="Email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
            />

            <Button
                label={loading ? "Signing in..." : "Login"}
                onClick={login}
                disabled={loading}
            />

        </div>

    );

}

// ============================================================================
// FILE:
// /frontend/components/auth/LoginForm.tsx
// ============================================================================

'use client';

import { useState } from "react";

import EnterpriseButton
from "@/components/ui/Button";

import AuthService
from "@/services/authService";

import { useAuthStore }
from "@/store/authStore";

export default function LoginForm(){

    const login = useAuthStore(

        s=>s.login

    );

    const [username,setUsername]=useState("");

    const [password,setPassword]=useState("");

    const [loading,setLoading]=useState(false);

    async function submit(){

        setLoading(true);

        try{

            const result = await AuthService.login({

                username,

                password

            });

            login(

                result.accessToken,

                result.profile

            );

        }

        finally{

            setLoading(false);

        }

    }

    return(

        <div>

            <input

                value={username}

                placeholder="Username"

                onChange={

                    e=>setUsername(e.target.value)

                }

            />

            <input

                type="password"

                value={password}

                placeholder="Password"

                onChange={

                    e=>setPassword(e.target.value)

                }

            />

            <EnterpriseButton

                loading={loading}

                onClick={submit}

            >

                Login

            </EnterpriseButton>

        </div>

    );

}

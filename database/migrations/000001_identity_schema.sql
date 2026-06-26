BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- PROFILES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.profiles (

    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    email TEXT UNIQUE NOT NULL,

    full_name TEXT,

    username TEXT UNIQUE,

    avatar_url TEXT,

    phone TEXT,

    website TEXT,

    company TEXT,

    bio TEXT,

    timezone TEXT DEFAULT 'UTC',

    language TEXT DEFAULT 'en',

    country TEXT,

    city TEXT,

    verified BOOLEAN DEFAULT FALSE,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- ORGANIZATIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.organizations (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    logo_url TEXT,

    website TEXT,

    description TEXT,

    owner_id UUID REFERENCES public.profiles(id),

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- ROLES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.roles (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT UNIQUE NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- PERMISSIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.permissions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT UNIQUE NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- ROLE PERMISSIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,

    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,

    UNIQUE(role_id,permission_id)

);

-- ==========================================================
-- ORGANIZATION MEMBERS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.organization_members (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    role_id UUID REFERENCES public.roles(id),

    joined_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(organization_id,profile_id)

);

-- ==========================================================
-- SESSIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.sessions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    device TEXT,

    ip_address TEXT,

    user_agent TEXT,

    refresh_token TEXT,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- DEVICES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.devices (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    device_name TEXT,

    os TEXT,

    browser TEXT,

    trusted BOOLEAN DEFAULT FALSE,

    last_seen TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- NOTIFICATIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.notifications (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    title TEXT,

    message TEXT,

    category TEXT,

    read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- ACTIVITY LOGS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    action TEXT,

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- AUDIT LOGS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor UUID REFERENCES public.profiles(id),

    entity TEXT,

    entity_id UUID,

    operation TEXT,

    payload JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- SETTINGS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.settings (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    setting_key TEXT,

    setting_value JSONB,

    UNIQUE(profile_id,setting_key)

);

COMMIT;

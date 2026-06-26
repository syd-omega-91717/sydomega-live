BEGIN;

-- =====================================================
-- TASKS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tasks (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

    creator_id UUID REFERENCES public.profiles(id),

    assignee_id UUID REFERENCES public.profiles(id),

    title TEXT NOT NULL,

    description TEXT,

    priority TEXT DEFAULT 'normal',

    status TEXT DEFAULT 'todo',

    estimated_hours NUMERIC,

    spent_hours NUMERIC DEFAULT 0,

    due_date TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

-- =====================================================
-- TASK COMMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_comments (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id),

    comment TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- =====================================================
-- TASK ATTACHMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_attachments (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id),

    filename TEXT,

    file_path TEXT,

    uploaded_at TIMESTAMPTZ DEFAULT now()

);

-- =====================================================
-- TASK LABELS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_labels (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT UNIQUE,

    color TEXT

);

-- =====================================================
-- TASK LABEL MAP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_label_map (

    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,

    label_id UUID REFERENCES public.task_labels(id) ON DELETE CASCADE,

    PRIMARY KEY(task_id,label_id)

);

COMMIT;

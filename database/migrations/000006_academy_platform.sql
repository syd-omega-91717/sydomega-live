BEGIN;

-- ==========================================================
-- COURSE CATEGORIES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.academy_categories (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    description TEXT,

    icon TEXT,

    color TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- COURSES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.academy_courses (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID REFERENCES public.academy_categories(id),

    instructor_id UUID REFERENCES public.profiles(id),

    title TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    description TEXT,

    thumbnail TEXT,

    difficulty TEXT DEFAULT 'Beginner',

    language TEXT DEFAULT 'English',

    duration_minutes INTEGER DEFAULT 0,

    xp_reward INTEGER DEFAULT 100,

    published BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- MODULES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.academy_modules (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID REFERENCES public.academy_courses(id) ON DELETE CASCADE,

    title TEXT NOT NULL,

    description TEXT,

    sort_order INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- LESSONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.academy_lessons (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    module_id UUID REFERENCES public.academy_modules(id) ON DELETE CASCADE,

    title TEXT NOT NULL,

    lesson_type TEXT DEFAULT 'video',

    video_url TEXT,

    article TEXT,

    attachment TEXT,

    duration_minutes INTEGER DEFAULT 0,

    xp_reward INTEGER DEFAULT 20,

    sort_order INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- ENROLLMENTS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.academy_enrollments (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID REFERENCES public.academy_courses(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    progress NUMERIC DEFAULT 0,

    completed BOOLEAN DEFAULT FALSE,

    enrolled_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(course_id,profile_id)

);

-- ==========================================================
-- COURSE PROGRESS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.academy_progress (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    enrollment_id UUID REFERENCES public.academy_enrollments(id) ON DELETE CASCADE,

    lesson_id UUID REFERENCES public.academy_lessons(id),

    completed BOOLEAN DEFAULT FALSE,

    completed_at TIMESTAMPTZ

);

-- ==========================================================
-- EXAMS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.academy_exams (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID REFERENCES public.academy_courses(id),

    title TEXT,

    pass_score INTEGER DEFAULT 70,

    duration_minutes INTEGER DEFAULT 30,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- QUESTIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.academy_questions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    exam_id UUID REFERENCES public.academy_exams(id) ON DELETE CASCADE,

    question TEXT NOT NULL,

    option_a TEXT,

    option_b TEXT,

    option_c TEXT,

    option_d TEXT,

    correct_answer TEXT,

    points INTEGER DEFAULT 1

);

-- ==========================================================
-- EXAM RESULTS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.academy_exam_results (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    exam_id UUID REFERENCES public.academy_exams(id),

    profile_id UUID REFERENCES public.profiles(id),

    score NUMERIC,

    passed BOOLEAN,

    completed_at TIMESTAMPTZ DEFAULT now()

);

COMMIT;

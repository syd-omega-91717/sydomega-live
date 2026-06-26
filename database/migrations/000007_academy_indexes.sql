CREATE INDEX IF NOT EXISTS idx_courses_category
ON public.academy_courses(category_id);

CREATE INDEX IF NOT EXISTS idx_courses_instructor
ON public.academy_courses(instructor_id);

CREATE INDEX IF NOT EXISTS idx_modules_course
ON public.academy_modules(course_id);

CREATE INDEX IF NOT EXISTS idx_lessons_module
ON public.academy_lessons(module_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_profile
ON public.academy_enrollments(profile_id);

CREATE INDEX IF NOT EXISTS idx_progress_enrollment
ON public.academy_progress(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_exam_course
ON public.academy_exams(course_id);

CREATE INDEX IF NOT EXISTS idx_exam_results_profile
ON public.academy_exam_results(profile_id);

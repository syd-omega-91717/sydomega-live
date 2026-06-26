INSERT INTO public.task_labels (name,color)

VALUES

('Bug','#EF4444'),

('Feature','#22C55E'),

('Enhancement','#3B82F6'),

('Research','#A855F7'),

('Backend','#F97316'),

('Frontend','#14B8A6'),

('Database','#64748B'),

('AI','#8B5CF6'),

('Security','#DC2626'),

('Documentation','#0EA5E9')

ON CONFLICT(name)

DO NOTHING;

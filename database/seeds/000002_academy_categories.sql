INSERT INTO public.academy_categories
(name,slug,description)

VALUES

('Artificial Intelligence','artificial-intelligence','AI Engineering'),

('Software Engineering','software-engineering','Full Stack Development'),

('Cyber Security','cyber-security','Security Engineering'),

('Quantum Computing','quantum-computing','Quantum Technologies'),

('Business','business','Leadership & Entrepreneurship'),

('Publishing','publishing','Books & Media'),

('Consultancy','consultancy','Professional Consulting'),

('Innovation','innovation','Research & Innovation')

ON CONFLICT(slug)

DO NOTHING;

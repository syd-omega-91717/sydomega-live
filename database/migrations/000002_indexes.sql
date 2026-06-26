CREATE INDEX idx_profiles_email
ON public.profiles(email);

CREATE INDEX idx_profiles_username
ON public.profiles(username);

CREATE INDEX idx_notifications_profile
ON public.notifications(profile_id);

CREATE INDEX idx_activity_profile
ON public.activity_logs(profile_id);

CREATE INDEX idx_sessions_profile
ON public.sessions(profile_id);

CREATE INDEX idx_devices_profile
ON public.devices(profile_id);

CREATE INDEX idx_org_members
ON public.organization_members(profile_id);

CREATE INDEX idx_audit_actor
ON public.audit_logs(actor);

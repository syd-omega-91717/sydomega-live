-- Ω SYD OMEGA 91717 — Privacy export privilege hardening
-- Live migration version: 20261004084024.

alter function public.export_my_data() security invoker;

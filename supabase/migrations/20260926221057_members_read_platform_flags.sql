-- public.get_platform_flag is a SECURITY INVOKER wrapper that calls
-- private.get_platform_flag (SECURITY DEFINER). authenticated could run the
-- wrapper but not the private function, so every member call failed with
-- 42501 and omega-flags.js (which fails closed) kept every flag-gated
-- section hidden, even with its flag on. Measured 2026-09-26 after turning
-- mfa_enrolment_enabled on: a member's call raised "permission denied for
-- function get_platform_flag". The function returns only a boolean switch
-- value. anon stays without it: no public page reads a flag.
grant execute on function private.get_platform_flag(text) to authenticated;

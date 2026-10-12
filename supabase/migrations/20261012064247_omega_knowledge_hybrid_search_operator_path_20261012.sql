-- Ω SYD OMEGA 91717
-- private.omega_knowledge_hybrid_search: resolve pgvector's <=> operator
-- 2026-10-12
--
-- The function is pinned to search_path='' and compares extensions.vector values
-- with a bare `<=>`. Operators resolve through search_path, so every call failed
-- at plan time -- even lexical-only calls with p_embedding = NULL:
--   42883 operator does not exist: extensions.vector <=> extensions.vector
-- (measured live 2026-10-12 as a member, once 20261012030000 let the call reach
-- the body). Every table reference in the body is already schema-qualified, so a
-- fixed path of `extensions` changes nothing but operator resolution, and
-- authenticated holds no CREATE on that schema. ALTER rather than a redefinition
-- keeps 20261008032308 the function's single canonical source.

alter function private.omega_knowledge_hybrid_search(text, text, integer) set search_path = extensions;

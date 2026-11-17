-- Ω SYD OMEGA 91717 — enforce the existing 50 MiB upload contract at Storage.
-- The browser helper already rejects files above 50 MiB, but clients can bypass
-- JavaScript. The private bucket must enforce the same ceiling server-side.
-- MIME remains unrestricted because publishing supports arbitrary binary files;
-- content signature validation and malware scanning are separate pending gates.

begin;
update storage.buckets
set file_size_limit = 52428800
where id = 'uploads';

do $$
declare
  bucket_limit bigint;
  bucket_public boolean;
begin
  select file_size_limit, public
    into bucket_limit, bucket_public
  from storage.buckets
  where id = 'uploads';

  if not found then
    raise exception 'uploads_bucket_missing';
  end if;
  if bucket_limit is distinct from 52428800 then
    raise exception 'uploads_bucket_limit_not_enforced: %', bucket_limit;
  end if;
  if bucket_public is distinct from false then
    raise exception 'uploads_bucket_must_remain_private';
  end if;
end;
$$;
commit;

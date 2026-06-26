CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS
$$
BEGIN

NEW.updated_at = now();

RETURN NEW;

END;
$$;

CREATE TRIGGER profiles_updated_at

BEFORE UPDATE

ON public.profiles

FOR EACH ROW

EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER organizations_updated_at

BEFORE UPDATE

ON public.organizations

FOR EACH ROW

EXECUTE FUNCTION public.update_updated_at();

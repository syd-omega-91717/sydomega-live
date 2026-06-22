BEGIN;

ALTER TABLE profiles ALTER COLUMN axis_a SET DEFAULT 0.001;
ALTER TABLE profiles ALTER COLUMN axis_b SET DEFAULT 0.001;
ALTER TABLE profiles ALTER COLUMN axis_c SET DEFAULT 0.001;
ALTER TABLE profiles ALTER COLUMN axis_a TYPE NUMERIC(7,3) USING COALESCE(axis_a,0.001);
ALTER TABLE profiles ALTER COLUMN axis_b TYPE NUMERIC(7,3) USING COALESCE(axis_b,0.001);
ALTER TABLE profiles ALTER COLUMN axis_c TYPE NUMERIC(7,3) USING COALESCE(axis_c,0.001);

UPDATE profiles SET axis_a=0.001, axis_b=0.001, axis_c=0.001
WHERE is_owner IS NOT TRUE AND axis_a >= 1 AND axis_b >= 1 AND axis_c >= 1;

UPDATE profiles SET axis_a=9.000, axis_b=9.000, axis_c=9.000
WHERE is_owner = TRUE;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS material_tier TEXT;

UPDATE profiles SET material_tier=
  CASE
    WHEN is_owner=TRUE THEN 'OMEGA MASTER'
    WHEN LEAST(axis_a,axis_b,axis_c)>=9.000 THEN 'OMEGA MASTER'
    WHEN LEAST(axis_a,axis_b,axis_c)>=8.000 THEN 'DIAMOND'
    WHEN LEAST(axis_a,axis_b,axis_c)>=7.000 THEN 'PLATINUM'
    WHEN LEAST(axis_a,axis_b,axis_c)>=6.000 THEN 'GOLD'
    WHEN LEAST(axis_a,axis_b,axis_c)>=5.000 THEN 'CARBON'
    WHEN LEAST(axis_a,axis_b,axis_c)>=4.000 THEN 'TITANIUM'
    WHEN LEAST(axis_a,axis_b,axis_c)>=3.000 THEN 'STEEL'
    WHEN LEAST(axis_a,axis_b,axis_c)>=2.000 THEN 'IRON'
    WHEN LEAST(axis_a,axis_b,axis_c)>=1.000 THEN 'GLASS'
    ELSE 'SAND'
  END;

ALTER TABLE task_completions
  ADD COLUMN IF NOT EXISTS axis TEXT DEFAULT 'a',
  ADD COLUMN IF NOT EXISTS increment NUMERIC(7,4) DEFAULT 0.001;

CREATE OR REPLACE FUNCTION complete_task(p_uid UUID, p_axis TEXT, p_kind TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_is_owner BOOLEAN; v_new NUMERIC; v_auth NUMERIC;
BEGIN
  SELECT is_owner INTO v_is_owner FROM profiles WHERE id=p_uid;
  IF v_is_owner THEN
    RETURN json_build_object('success',TRUE,'owner',TRUE,'message','Architect is at apex');
  END IF;
  IF p_axis='a' THEN
    UPDATE profiles SET axis_a=LEAST(9.000,COALESCE(axis_a,0.001)+0.001) WHERE id=p_uid RETURNING axis_a INTO v_new;
  ELSIF p_axis='b' THEN
    UPDATE profiles SET axis_b=LEAST(9.000,COALESCE(axis_b,0.001)+0.001) WHERE id=p_uid RETURNING axis_b INTO v_new;
  ELSE
    UPDATE profiles SET axis_c=LEAST(9.000,COALESCE(axis_c,0.001)+0.001) WHERE id=p_uid RETURNING axis_c INTO v_new;
  END IF;
  INSERT INTO task_completions(user_id,kind,axis,increment,completed_at)
    VALUES(p_uid,p_kind,p_axis,0.001,NOW());
  SELECT SQRT(POWER(axis_a,2)+POWER(axis_b,2)+POWER(axis_c,2)) INTO v_auth FROM profiles WHERE id=p_uid;
  RETURN json_build_object('success',TRUE,'axis',p_axis,'new_value',v_new,'authority',ROUND(v_auth,3));
END;
$$;

CREATE OR REPLACE FUNCTION protect_owner_apex() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_owner=TRUE THEN
    NEW.axis_a:=9.000; NEW.axis_b:=9.000; NEW.axis_c:=9.000;
  END IF;
  NEW.axis_a:=GREATEST(0.001,LEAST(9.000,COALESCE(NEW.axis_a,0.001)));
  NEW.axis_b:=GREATEST(0.001,LEAST(9.000,COALESCE(NEW.axis_b,0.001)));
  NEW.axis_c:=GREATEST(0.001,LEAST(9.000,COALESCE(NEW.axis_c,0.001)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_apex_guard ON profiles;
CREATE TRIGGER owner_apex_guard BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_owner_apex();

COMMIT;

-- ============================================================================
-- Ω SYD OMEGA 91717 — PLATFORM EXPANSION SQL
-- Activity Feed, Expert Bookings, Media Items, Member Posts
-- Covers: M2 Consultancy, M6 Media Universe, M8 Communication
-- ============================================================================

-- ── ACTIVITY FEED (Discord/Reddit pattern) ────────────────────────────────
-- Aggregated stream of platform events visible to members
CREATE TABLE IF NOT EXISTS public.activity_feed(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text       NOT NULL,  -- 'task_complete','gate_unlock','join','trophy','exam_pass'
  title        text        NOT NULL,
  body         text,
  metadata     jsonb       DEFAULT '{}',
  is_public    boolean     NOT NULL DEFAULT true,
  likes_count  int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feed_public ON public.activity_feed(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_user   ON public.activity_feed(user_id, created_at DESC);
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members see public feed" ON public.activity_feed;
CREATE POLICY "members see public feed" ON public.activity_feed FOR SELECT USING(is_public=true OR user_id=auth.uid());
DROP POLICY IF EXISTS "member manages own feed" ON public.activity_feed;
CREATE POLICY "member manages own feed" ON public.activity_feed FOR ALL USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());

-- ── EXPERT BOOKINGS (M2 Consultancy Hub) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expert_bookings(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expert_id    uuid        REFERENCES public.profiles(id),
  domain       text        NOT NULL,  -- 'medical','legal','engineering','business','publishing','economy'
  title        text        NOT NULL,
  description  text,
  status       text        NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  duration_min int         DEFAULT 60,
  price_omega  numeric(12,4),
  meeting_url  text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT domain_ck CHECK(domain IN('medical','legal','engineering','business','publishing','economy','technology','finance')),
  CONSTRAINT status_ck CHECK(status IN('pending','confirmed','in_progress','completed','cancelled','refunded'))
);
CREATE INDEX IF NOT EXISTS idx_book_client ON public.expert_bookings(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_expert ON public.expert_bookings(expert_id, scheduled_at);
ALTER TABLE public.expert_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own bookings" ON public.expert_bookings;
CREATE POLICY "member sees own bookings" ON public.expert_bookings FOR SELECT USING(client_id=auth.uid() OR expert_id=auth.uid());
DROP POLICY IF EXISTS "member creates bookings" ON public.expert_bookings;
CREATE POLICY "member creates bookings" ON public.expert_bookings FOR INSERT WITH CHECK(client_id=auth.uid());
DROP POLICY IF EXISTS "owner sees all bookings" ON public.expert_bookings;
CREATE POLICY "owner sees all bookings" ON public.expert_bookings FOR SELECT USING(public.is_platform_owner());

-- ── MEDIA ITEMS (M6 Media Universe) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media_items(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type   text        NOT NULL,  -- 'movie','series','trailer','demo','short'
  title        text        NOT NULL,
  subtitle     text,
  description  text,
  olympian     text,       -- which Olympian this content belongs to
  track_id     int,        -- which of the 12 tracks
  element      text,
  duration_min int,
  min_auth     numeric(8,4) DEFAULT 0, -- minimum authority to access
  thumbnail_url text,
  video_url    text,
  status       text        NOT NULL DEFAULT 'pending', -- 'pending','live','archived'
  phase        int         DEFAULT 1,
  sort_order   int         DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT type_ck CHECK(media_type IN('movie','series','episode','trailer','demo','short','documentary'))
);
CREATE INDEX IF NOT EXISTS idx_media_track ON public.media_items(track_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_media_auth  ON public.media_items(min_auth, status);
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members see live media" ON public.media_items;
CREATE POLICY "members see live media" ON public.media_items FOR SELECT USING(status='live' OR public.is_platform_owner());

-- Seed 12 sovereign movie entries (Phase I catalogue)
INSERT INTO public.media_items(media_type,title,subtitle,olympian,track_id,element,min_auth,status,phase,sort_order) VALUES
  ('movie','GENESIS: THE ORIGIN','The founding of the sovereign order','Ares',1,'fire',0,'pending',1,1),
  ('movie','FOUNDATION: THE STRUCTURE','How the 104,976-node lattice was built','Aphrodite',2,'metal',2.32,'pending',1,2),
  ('movie','ASCENSION: THE RISE','The first member climbs to Gate 3','Apollo',3,'wind',4.64,'pending',1,3),
  ('movie','SOVEREIGNTY: PERSONAL POWER','Mastery of the self before mastery of the world','Artemis',4,'water',6.96,'pending',1,4),
  ('movie','HERITAGE: THE LINEAGE','Bloodlines, genealogy, and sovereign legacy','Hermes',5,'metal',9.28,'pending',1,5),
  ('movie','MASTERY: DEEP EXPERTISE','The Axis B journey to 9.000','Zeus',6,'fire',11.60,'pending',1,6),
  ('movie','CREATION: BUILDING WORLDS','From concept to sovereign architecture','Athena',7,'wind',13.92,'pending',1,7),
  ('movie','ECONOMY: VALUE AND EXCHANGE','The 12-token sovereign economy','Poseidon',8,'water',16.24,'pending',1,8),
  ('movie','INTELLIGENCE: AI AND MIND','How artificial intelligence serves sovereignty','Hephaestus',9,'metal',18.56,'pending',1,9),
  ('movie','COVENANT: LAW AND ORDER','The 11 immutable articles in narrative form','Hera',10,'wind',20.88,'pending',1,10),
  ('movie','LEGACY: THE PERMANENT RECORD','What remains when the sovereign leaves','Demeter',11,'metal',23.20,'pending',1,11),
  ('movie','OMEGA: THE APEX','Auth=27.8367. The final sovereign achievement.','Dionysus',12,'water',27.00,'pending',1,12)
ON CONFLICT DO NOTHING;

-- ── MEMBER POSTS (Social layer M8) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_posts(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_type    text        NOT NULL DEFAULT 'text',  -- 'text','achievement','milestone','question'
  title        text,
  body         text        NOT NULL,
  tags         text[]      DEFAULT '{}',
  track_id     int,
  likes_count  int         NOT NULL DEFAULT 0,
  comments_count int       NOT NULL DEFAULT 0,
  is_pinned    boolean     DEFAULT false,
  status       text        NOT NULL DEFAULT 'published',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_type_ck CHECK(post_type IN('text','achievement','milestone','question','insight','announcement')),
  CONSTRAINT status_ck CHECK(status IN('draft','published','archived','removed'))
);
CREATE INDEX IF NOT EXISTS idx_posts_public ON public.member_posts(status, created_at DESC);
ALTER TABLE public.member_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members see published posts" ON public.member_posts;
CREATE POLICY "members see published posts" ON public.member_posts FOR SELECT USING(status='published' OR user_id=auth.uid());
DROP POLICY IF EXISTS "member manages own posts" ON public.member_posts;
CREATE POLICY "member manages own posts" ON public.member_posts FOR ALL USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());

-- ── GET ACTIVITY FEED RPC ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_activity_feed(p_limit int DEFAULT 20, p_offset int DEFAULT 0)
RETURNS TABLE(id uuid, user_id uuid, display_name text, element text, activity_type text, title text, body text, metadata jsonb, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public AS $$
  SELECT af.id, af.user_id, pr.display_name, pr.element, af.activity_type, af.title, af.body, af.metadata, af.created_at
  FROM public.activity_feed af
  JOIN public.profiles pr ON pr.id=af.user_id
  WHERE af.is_public=true
  ORDER BY af.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;
GRANT EXECUTE ON FUNCTION public.get_activity_feed(int,int) TO authenticated;

-- ── AUTO-LOG activity when task completes ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_task_to_feed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.activity_feed(user_id,activity_type,title,body,metadata)
  VALUES(NEW.user_id,'task_complete',
    'Completed: '||NEW.task_name,
    'Earned +'||NEW.points_earned||' on Axis '||UPPER(NEW.axis_type)||'. Authority advancing.',
    jsonb_build_object('task',NEW.task_name,'axis',NEW.axis_type,'points',NEW.points_earned)
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trig_task_to_feed ON public.task_completions;
CREATE TRIGGER trig_task_to_feed
  AFTER INSERT ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.log_task_to_feed();

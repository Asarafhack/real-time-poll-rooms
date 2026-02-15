
-- table for poll rooms
CREATE TABLE public.rooms (
  id TEXT NOT NULL DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8) PRIMARY KEY,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- options for each room
CREATE TABLE public.options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- votes cast by visitors
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.options(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, voter_id)
);

-- RLS on rooms: anyone can read, anyone can insert
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);

-- RLS on options: anyone can read, anyone can insert
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can view options" ON public.options FOR SELECT USING (true);
CREATE POLICY "anyone can add options" ON public.options FOR INSERT WITH CHECK (true);

-- RLS on votes: anyone can read, anyone can insert (unique constraint prevents duplicates)
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can view votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "anyone can cast vote" ON public.votes FOR INSERT WITH CHECK (true);

-- enable realtime for votes so results update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

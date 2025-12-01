-- Add selection column to bets and replace place_bet RPC to accept selection
ALTER TABLE IF EXISTS public.bets
  ADD COLUMN IF NOT EXISTS selection text;

-- Replace place_bet to include selection
CREATE OR REPLACE FUNCTION public.place_bet(
  p_user_id uuid,
  p_match_id text,
  p_stake numeric,
  p_odds numeric,
  p_selection text
) RETURNS TABLE(
  id uuid,
  user_id uuid,
  match_id text,
  stake numeric,
  odds numeric,
  selection text,
  status text,
  payout numeric,
  created_at timestamptz
) AS $$
DECLARE
  cur_balance numeric;
  new_balance numeric;
  inserted_id uuid;
BEGIN
  -- Lock the profile row to prevent race conditions
  SELECT balance INTO cur_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF cur_balance IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF cur_balance < p_stake THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  new_balance := cur_balance - p_stake;

  UPDATE public.profiles SET balance = new_balance WHERE id = p_user_id;

  INSERT INTO public.bets(id, user_id, match_id, stake, odds, selection, status, payout, created_at)
  VALUES (gen_random_uuid(), p_user_id, p_match_id, p_stake, p_odds, p_selection, 'PENDING', 0, now())
  RETURNING id INTO inserted_id;

  RETURN QUERY SELECT id, user_id, match_id, stake, odds, selection, status, payout, created_at FROM public.bets WHERE id = inserted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settlement function: settle bets for a given match
CREATE OR REPLACE FUNCTION public.settle_bets_for_match(p_match_id text)
RETURNS TABLE(bet_id uuid, user_id uuid, old_status text, new_status text, payout numeric) AS $$
DECLARE
  rec RECORD;
  match_row RECORD;
  outcome text;
  bet_rec RECORD;
  computed_payout numeric;
BEGIN
  SELECT * INTO match_row FROM public.matches WHERE id = p_match_id LIMIT 1;
  IF match_row IS NULL THEN
    RAISE EXCEPTION 'match_not_found';
  END IF;

  -- Expect score JSON with numeric fields home and away
  IF match_row.score IS NULL THEN
    RAISE EXCEPTION 'match_score_missing';
  END IF;

  IF (match_row.score ->> 'home')::int > (match_row.score ->> 'away')::int THEN
    outcome := 'HOME';
  ELSIF (match_row.score ->> 'home')::int < (match_row.score ->> 'away')::int THEN
    outcome := 'AWAY';
  ELSE
    outcome := 'DRAW';
  END IF;

  FOR rec IN SELECT * FROM public.bets WHERE match_id = p_match_id AND status = 'PENDING' FOR UPDATE LOOP
    IF rec.selection = outcome THEN
      computed_payout := rec.stake * rec.odds;
      UPDATE public.bets SET status = 'WON', payout = computed_payout, settled_at = now() WHERE id = rec.id;
      -- credit user
      UPDATE public.profiles SET balance = balance + computed_payout WHERE id = rec.user_id;
      bet_id := rec.id; user_id := rec.user_id; old_status := 'PENDING'; new_status := 'WON'; payout := computed_payout;
      RETURN NEXT;
    ELSE
      UPDATE public.bets SET status = 'LOST', payout = 0, settled_at = now() WHERE id = rec.id;
      bet_id := rec.id; user_id := rec.user_id; old_status := 'PENDING'; new_status := 'LOST'; payout := 0;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

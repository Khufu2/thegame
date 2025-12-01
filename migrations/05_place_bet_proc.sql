-- Stored procedure to place a bet atomically
-- Usage: SELECT * FROM public.place_bet(p_user_id := 'uuid', p_match_id := 'match123', p_stake := 10::numeric, p_odds := 2.1::numeric);

CREATE OR REPLACE FUNCTION public.place_bet(
  p_user_id uuid,
  p_match_id text,
  p_stake numeric,
  p_odds numeric
) RETURNS TABLE(
  id uuid,
  user_id uuid,
  match_id text,
  stake numeric,
  odds numeric,
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

  INSERT INTO public.bets(id, user_id, match_id, stake, odds, status, payout, created_at)
  VALUES (gen_random_uuid(), p_user_id, p_match_id, p_stake, p_odds, 'PENDING', 0, now())
  RETURNING id INTO inserted_id;

  RETURN QUERY SELECT id, user_id, match_id, stake, odds, status, payout, created_at FROM public.bets WHERE id = inserted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

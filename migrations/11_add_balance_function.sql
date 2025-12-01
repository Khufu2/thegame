-- Function to add balance to user account (for deposits, winnings, etc.)
CREATE OR REPLACE FUNCTION public.add_balance(
  p_user_id uuid,
  p_amount numeric
) RETURNS numeric AS $$
DECLARE
  cur_balance numeric;
  new_balance numeric;
BEGIN
  -- Lock the profile row to prevent race conditions
  SELECT balance INTO cur_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  
  IF cur_balance IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  new_balance := COALESCE(cur_balance, 0) + p_amount;

  UPDATE public.profiles SET balance = new_balance WHERE id = p_user_id;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.add_balance(uuid, numeric) TO service_role;



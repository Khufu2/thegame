-- Update finished matches with correct scores
UPDATE matches 
SET 
  status = 'finished', 
  home_team_score = 1, 
  away_team_score = 4, 
  result = 'AWAY_TEAM',
  updated_at = now()
WHERE id = 'football-data-537934';

-- Update any matches that should be finished based on kickoff time (more than 3 hours ago)
UPDATE matches 
SET status = 'finished'
WHERE status = 'scheduled' 
  AND kickoff_time < (now() - interval '3 hours');
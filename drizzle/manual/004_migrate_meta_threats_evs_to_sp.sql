-- Migrate meta_threats EV values (0-252) to SP values (0-32) in all saved teams
-- Run: 2026-04-13
-- This converts any meta threat with evs values > 32 to SP format

-- PostgreSQL function to convert a single EV value to SP
-- round(ev/8), capped at 32
CREATE OR REPLACE FUNCTION ev_to_sp(ev integer) RETURNS integer AS $$
BEGIN
  IF ev <= 0 THEN RETURN 0; END IF;
  RETURN LEAST(ROUND(ev::numeric / 8), 32);
END;
$$ LANGUAGE plpgsql;

-- Update all teams that have meta_threats with old EV values
UPDATE teams
SET meta_threats = (
  SELECT jsonb_agg(
    CASE
      WHEN (threat->'evs' IS NOT NULL) AND (
        COALESCE((threat->'evs'->>'hp')::int, 0) > 32 OR
        COALESCE((threat->'evs'->>'atk')::int, 0) > 32 OR
        COALESCE((threat->'evs'->>'def')::int, 0) > 32 OR
        COALESCE((threat->'evs'->>'spa')::int, 0) > 32 OR
        COALESCE((threat->'evs'->>'spd')::int, 0) > 32 OR
        COALESCE((threat->'evs'->>'spe')::int, 0) > 32
      )
      THEN jsonb_set(threat, '{evs}', jsonb_build_object(
        'hp', ev_to_sp(COALESCE((threat->'evs'->>'hp')::int, 0)),
        'atk', ev_to_sp(COALESCE((threat->'evs'->>'atk')::int, 0)),
        'def', ev_to_sp(COALESCE((threat->'evs'->>'def')::int, 0)),
        'spa', ev_to_sp(COALESCE((threat->'evs'->>'spa')::int, 0)),
        'spd', ev_to_sp(COALESCE((threat->'evs'->>'spd')::int, 0)),
        'spe', ev_to_sp(COALESCE((threat->'evs'->>'spe')::int, 0))
      ))
      ELSE threat
    END
  )
  FROM jsonb_array_elements(meta_threats) AS threat
)
WHERE meta_threats IS NOT NULL
AND meta_threats::text LIKE '%252%';

-- Clean up
DROP FUNCTION ev_to_sp(integer);

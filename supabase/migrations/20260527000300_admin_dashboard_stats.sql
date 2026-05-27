CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can read dashboard stats';
  END IF;

  SELECT jsonb_build_object(
    'totalDoctors', (SELECT COUNT(*) FROM public.doctors),
    'totalCourses', (SELECT COUNT(*) FROM public.courses),
    'totalCredits', (SELECT COALESCE(SUM(credits), 0) FROM public.courses),
    'specialtyCounts', (
      SELECT COALESCE(jsonb_object_agg(label, total), '{}'::jsonb)
      FROM (
        SELECT COALESCE(NULLIF(TRIM(specialty), ''), '__unspecified__') AS label, COUNT(*) AS total
        FROM public.doctors
        GROUP BY 1
      ) grouped_specialties
    ),
    'provinceCounts', (
      SELECT COALESCE(jsonb_object_agg(label, total), '{}'::jsonb)
      FROM (
        SELECT COALESCE(NULLIF(TRIM(province), ''), '__unspecified__') AS label, COUNT(*) AS total
        FROM public.doctors
        GROUP BY 1
      ) grouped_provinces
    )
  )
  INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;

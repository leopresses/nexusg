CREATE TRIGGER prevent_plan_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_plan_self_update();
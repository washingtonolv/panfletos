# Supabase adapter
Document schema and RLS policies; enforce tenant isolation server-side; use least-privilege keys; never expose service_role in clients. Treat migrations as high-risk: preview SQL, backup plan, forward/rollback strategy and approval before executing. Test policies for anonymous, regular and admin roles.

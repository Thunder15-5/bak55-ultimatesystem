-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listening_history;
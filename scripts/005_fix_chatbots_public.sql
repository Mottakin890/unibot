-- Fix existing chatbots so the widget works for anonymous visitors.
-- The RLS policy "chatbots_select_public" only allows anon SELECT when
-- is_public = true, but all previously created chatbots defaulted to false.

update public.chatbots
set is_public = true
where is_public = false;

-- Confirm how many rows were updated:
select count(*) as updated_chatbots from public.chatbots where is_public = true;

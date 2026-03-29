-- P&L Tracker Pro Database Schema
-- This schema includes Row Level Security (RLS) policies
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  deductibility_percentage numeric(5,2) default 100 check (deductibility_percentage >= 0 and deductibility_percentage <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for better performance
create index idx_categories_user_id on categories(user_id);
create index idx_categories_type on categories(type);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  amount numeric(12,2) not null check (amount > 0),
  category_id uuid references categories(id) on delete set null,
  notes text default '',
  recurring_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for better performance
create index idx_transactions_user_id on transactions(user_id);
create index idx_transactions_date on transactions(user_id, date desc);
create index idx_transactions_type on transactions(type);
create index idx_transactions_category_id on transactions(category_id);
create index idx_transactions_recurring_id on transactions(recurring_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- CRITICAL: These policies ensure users can only access their own data
-- ============================================

-- Enable RLS on both tables
alter table categories enable row level security;
alter table transactions enable row level security;

-- Categories RLS Policies
create policy "Users can view their own categories"
  on categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on categories for delete
  using (auth.uid() = user_id);

-- Transactions RLS Policies
create policy "Users can view their own transactions"
  on transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on transactions for delete
  using (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMP
-- ============================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for categories table
create trigger update_categories_updated_at
  before update on categories
  for each row
  execute procedure update_updated_at_column();

-- Trigger for transactions table
create trigger update_transactions_updated_at
  before update on transactions
  for each row
  execute procedure update_updated_at_column();

-- ============================================
-- SEED DATA (Optional - Default Categories)
-- ============================================
-- Note: These will be inserted per-user in the application
-- This is just a reference for the default categories

-- Example default categories structure:
-- Income Categories:
--   - Sales
--   - Consulting
--   - Freelance Work
--
-- Expense Categories:
--   - Rent (100% deductible)
--   - Utilities (100% deductible)
--   - Marketing (100% deductible)
--   - Software/SaaS (100% deductible)
--   - Travel (100% deductible)
--   - Office Supplies (100% deductible)
--   - Insurance (100% deductible)
--   - Business Meals (50% deductible)

-- ============================================
-- SECURITY NOTES
-- ============================================
-- 1. RLS is enabled on all tables
-- 2. Users can only access their own data
-- 3. All operations are scoped to auth.uid()
-- 4. Foreign key constraints ensure data integrity
-- 5. Check constraints validate data types and ranges
-- 6. Timestamps are stored in UTC
-- 7. Soft deletes are NOT implemented - consider adding if needed

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- If you need to modify this schema in the future:
-- 1. Always backup your database first
-- 2. Test migrations in a development environment
-- 3. Use Supabase migrations for production changes
-- 4. Never disable RLS policies in production

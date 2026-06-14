ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signup_account_type TEXT
  CHECK (signup_account_type IN ('client', 'host'));

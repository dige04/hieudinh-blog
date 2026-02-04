-- Create subscriber status enum
CREATE TYPE subscriber_status AS ENUM ('pending', 'active', 'unsubscribed');

-- Create subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status subscriber_status DEFAULT 'pending',
  confirm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_token ON subscribers(confirm_token) WHERE confirm_token IS NOT NULL;
CREATE INDEX idx_subscribers_status ON subscribers(status);

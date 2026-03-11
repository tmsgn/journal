-- ================================================================
-- TradeJournal Professional Upgrade Migration
-- Run this in your Supabase SQL Editor to add new columns
-- ================================================================

-- Add Direction column (long or short)
ALTER TABLE journal_trades
  ADD COLUMN IF NOT EXISTS direction TEXT 
  DEFAULT 'long' 
  CHECK (direction IN ('long', 'short'));

-- Add Session column (trading session)
ALTER TABLE journal_trades
  ADD COLUMN IF NOT EXISTS session TEXT 
  DEFAULT 'new-york'
  CHECK (session IN ('london', 'new-york', 'asian', 'london-close'));

-- Add P&L column (dollar profit/loss - optional)
ALTER TABLE journal_trades
  ADD COLUMN IF NOT EXISTS pnl NUMERIC(12, 2) NULL;

-- ================================================================
-- Done! Your existing trades will default to direction='long'
-- and session='new-york'. You can update them individually 
-- in the Edit Trade dialog.
-- ================================================================

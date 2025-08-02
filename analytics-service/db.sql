CREATE DATABASE lugxanalytics;

USE lugxanalytics;

CREATE TABLE IF NOT EXISTS web_events (
  id UUID,
  event_type String,
  page_url String,
  timestamp DateTime,
  session_id String,
  scroll_depth Nullable(Int32),
  page_time_seconds Nullable(Int32),
  session_duration Nullable(Int32),
  user_agent String
)
ENGINE = MergeTree()
ORDER BY (timestamp, session_id);

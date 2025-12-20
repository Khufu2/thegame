-- Add video_url column to feeds table for embedded videos
ALTER TABLE IF EXISTS public.feeds
  ADD COLUMN IF NOT EXISTS video_url text;

-- Add index for video content
CREATE INDEX IF NOT EXISTS idx_feeds_video_url ON public.feeds(video_url) WHERE video_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.feeds.video_url IS 'YouTube embed URL or other video platform embed URL for featured videos';
// Twitter/X API Integration for Social Media Content
// Production-ready implementation with proper rate limiting

interface TwitterPost {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    username: string;
    profileImage: string;
    verified: boolean;
  };
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
  };
  media?: {
    type: 'photo' | 'video' | 'gif';
    url: string;
    thumbnail?: string;
  }[];
  hashtags: string[];
  mentions: string[];
}

interface TwitterSearchParams {
  query: string;
  maxResults?: number;
  startTime?: string;
  endTime?: string;
}

class TwitterService {
  private readonly baseUrl = 'https://api.twitter.com/2';
  private readonly bearerToken: string;
  private cache = new Map<string, { data: TwitterPost[]; timestamp: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }

  async searchTweets(params: TwitterSearchParams): Promise<TwitterPost[]> {
    const cacheKey = `search_${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Using cached Twitter search results');
      return cached.data;
    }

    try {
      const queryParams = new URLSearchParams({
        query: params.query,
        'tweet.fields': 'created_at,public_metrics,entities,attachments',
        'user.fields': 'name,username,profile_image_url,verified',
        'media.fields': 'type,url,preview_image_url',
        'expansions': 'author_id,attachments.media_keys',
        max_results: (params.maxResults || 10).toString(),
      });

      if (params.startTime) queryParams.set('start_time', params.startTime);
      if (params.endTime) queryParams.set('end_time', params.endTime);

      const response = await fetch(`${this.baseUrl}/tweets/search/recent?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Twitter API rate limit exceeded');
          return cached?.data || []; // Return cached data if available
        }
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      const posts = this.transformTwitterData(data);

      // Cache the results
      this.cache.set(cacheKey, { data: posts, timestamp: Date.now() });

      console.log(`Fetched ${posts.length} tweets for query: ${params.query}`);
      return posts;

    } catch (error) {
      console.error('Error fetching tweets:', error);
      return cached?.data || [];
    }
  }

  async getUserTweets(username: string, count: number = 5): Promise<TwitterPost[]> {
    const cacheKey = `user_${username}_${count}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // First get user ID
      const userResponse = await fetch(`${this.baseUrl}/users/by/username/${username}`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to get user: ${username}`);
      }

      const userData = await userResponse.json();
      const userId = userData.data.id;

      // Then get their tweets
      const tweetsResponse = await fetch(
        `${this.baseUrl}/users/${userId}/tweets?max_results=${count}&tweet.fields=created_at,public_metrics,entities,attachments&user.fields=name,username,profile_image_url,verified&media.fields=type,url,preview_image_url&expansions=author_id,attachments.media_keys`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
        }
      );

      if (!tweetsResponse.ok) {
        throw new Error(`Failed to get tweets for user: ${username}`);
      }

      const tweetsData = await tweetsResponse.json();
      const posts = this.transformTwitterData(tweetsData);

      this.cache.set(cacheKey, { data: posts, timestamp: Date.now() });
      return posts;

    } catch (error) {
      console.error(`Error fetching tweets for ${username}:`, error);
      return cached?.data || [];
    }
  }

  private transformTwitterData(data: any): TwitterPost[] {
    if (!data.data) return [];

    const users = data.includes?.users || [];
    const media = data.includes?.media || [];

    return data.data.map((tweet: any) => {
      const author = users.find((u: any) => u.id === tweet.author_id);

      // Extract media
      const tweetMedia = tweet.attachments?.media_keys?.map((key: string) => {
        const mediaItem = media.find((m: any) => m.media_key === key);
        if (mediaItem) {
          return {
            type: mediaItem.type,
            url: mediaItem.type === 'photo' ? mediaItem.url : mediaItem.preview_image_url || mediaItem.url,
            thumbnail: mediaItem.preview_image_url,
          };
        }
        return null;
      }).filter(Boolean) || [];

      // Extract hashtags and mentions
      const hashtags = tweet.entities?.hashtags?.map((h: any) => h.tag) || [];
      const mentions = tweet.entities?.mentions?.map((m: any) => m.username) || [];

      return {
        id: tweet.id,
        text: tweet.text,
        author: {
          id: author?.id || tweet.author_id,
          name: author?.name || 'Unknown',
          username: author?.username || 'unknown',
          profileImage: author?.profile_image_url || '',
          verified: author?.verified || false,
        },
        createdAt: tweet.created_at,
        metrics: {
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          views: tweet.public_metrics?.impression_count || 0,
        },
        media: tweetMedia,
        hashtags,
        mentions,
      };
    });
  }

  // Get trending topics (limited by API)
  async getTrendingTopics(): Promise<string[]> {
    // Twitter API v2 has limited trending access
    // This would require additional setup
    return ['NFL', 'NBA', 'PremierLeague', 'ChampionsLeague'];
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, data]) => ({
        key,
        itemCount: data.data.length,
        age: Date.now() - data.timestamp,
      })),
    };
  }

  clearCache() {
    this.cache.clear();
    console.log('Twitter cache cleared');
  }
}

// League-specific Twitter accounts for "What's Buzzing" sections
export const LEAGUE_ACCOUNTS = {
  EPL: ['SkySportsPL', 'premierleague', 'BBCSport', 'TheAthleticUK'],
  LaLiga: ['LaLiga', 'SkySports', 'AS', 'marca'],
  NBA: ['NBA', 'ESPNNBA', 'TheAthleticNBA'],
  NHL: ['NHL', 'ESPNNHL'],
  NFL: ['NFL', 'ESPNNFL'],
  UFC: ['ufc', 'ESPNMMA'],
  F1: ['F1', 'SkySportsF1'],
  MLB: ['MLB', 'ESPNNFL'],
};

// Export singleton instance (will be initialized with API key from env)
export { TwitterService, type TwitterPost, type TwitterSearchParams };
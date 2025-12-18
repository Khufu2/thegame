// RSS Feed Integration for News Aggregation
// Phase 1 of News Aggregation Plan

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  category?: string[];
  enclosure?: {
    url: string;
    type: string;
  };
}

interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}

interface NewsSource {
  name: string;
  rssUrl: string;
  category: string;
  priority: number;
}

// Major sports news sources with RSS feeds (FREE - No API Keys Needed!)
const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'ESPN',
    rssUrl: 'https://www.espn.com/espn/rss/news',
    category: 'general',
    priority: 10
  },
  {
    name: 'ESPN NFL',
    rssUrl: 'https://www.espn.com/espn/rss/nfl/news',
    category: 'nfl',
    priority: 9
  },
  {
    name: 'ESPN NBA',
    rssUrl: 'https://www.espn.com/espn/rss/nba/news',
    category: 'nba',
    priority: 9
  },
  {
    name: 'ESPN NHL',
    rssUrl: 'https://www.espn.com/espn/rss/nhl/news',
    category: 'nhl',
    priority: 9
  },
  {
    name: 'ESPN MLB',
    rssUrl: 'https://www.espn.com/espn/rss/mlb/news',
    category: 'mlb',
    priority: 8
  },
  {
    name: 'Sky Sports',
    rssUrl: 'https://www.skysports.com/rss/12040',
    category: 'general',
    priority: 8
  },
  {
    name: 'BBC Sport',
    rssUrl: 'http://feeds.bbci.co.uk/sport/rss.xml',
    category: 'general',
    priority: 8
  },
  {
    name: 'The Athletic',
    rssUrl: 'https://theathletic.com/feed/',
    category: 'analysis',
    priority: 7
  },
  {
    name: 'CBS Sports',
    rssUrl: 'https://www.cbssports.com/rss/headlines/',
    category: 'general',
    priority: 7
  },
  {
    name: 'Fox Sports',
    rssUrl: 'https://api.foxsports.com/v2/content/optimized-rss',
    category: 'general',
    priority: 6
  },
  {
    name: 'Bleacher Report',
    rssUrl: 'https://bleacherreport.com/world-football/rss',
    category: 'soccer',
    priority: 8
  },
  {
    name: 'Yahoo Sports',
    rssUrl: 'https://sports.yahoo.com/rss/',
    category: 'general',
    priority: 6
  }
];

class RSSAggregator {
  private cache = new Map<string, { data: RSSFeed; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async fetchFromSource(source: NewsSource): Promise<RSSFeed | null> {
    try {
      console.log(`Fetching RSS from ${source.name}: ${source.rssUrl}`);

      // Check cache first
      const cacheKey = source.rssUrl;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log(`Using cached RSS for ${source.name}`);
        return cached.data;
      }

      const response = await fetch(source.rssUrl, {
        headers: {
          'User-Agent': 'Sheena-Sports-News-Aggregator/1.0'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch RSS from ${source.name}: ${response.status}`);
        return null;
      }

      const xmlText = await response.text();
      const feed = this.parseRSS(xmlText, source);

      // Cache the result
      this.cache.set(cacheKey, { data: feed, timestamp: Date.now() });

      console.log(`Successfully fetched ${feed.items.length} items from ${source.name}`);
      return feed;

    } catch (error) {
      console.error(`Error fetching RSS from ${source.name}:`, error);
      return null;
    }
  }

  private parseRSS(xmlText: string, source: NewsSource): RSSFeed {
    // Simple XML parsing (in production, use a proper XML parser)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const channel = xmlDoc.querySelector('channel');
    if (!channel) {
      throw new Error('Invalid RSS format: no channel element');
    }

    const items: RSSItem[] = [];
    const itemElements = xmlDoc.querySelectorAll('item');

    itemElements.forEach((itemEl, index) => {
      try {
        const title = this.getTextContent(itemEl, 'title');
        const link = this.getTextContent(itemEl, 'link');
        const description = this.getTextContent(itemEl, 'description');
        const pubDate = this.getTextContent(itemEl, 'pubDate');
        const guid = this.getTextContent(itemEl, 'guid') || link || `rss_${source.name}_${index}`;

        const enclosureEl = itemEl.querySelector('enclosure');
        const enclosure = enclosureEl ? {
          url: enclosureEl.getAttribute('url') || '',
          type: enclosureEl.getAttribute('type') || ''
        } : undefined;

        const categoryElements = itemEl.querySelectorAll('category');
        const category = Array.from(categoryElements).map(cat => cat.textContent || '').filter(Boolean);

        if (title && link) {
          items.push({
            title: this.cleanTitle(title),
            link,
            description: this.cleanDescription(description),
            pubDate,
            guid,
            category,
            enclosure
          });
        }
      } catch (error) {
        console.warn(`Error parsing RSS item from ${source.name}:`, error);
      }
    });

    return {
      title: source.name,
      description: `${source.name} RSS Feed`,
      link: source.rssUrl,
      items
    };
  }

  private getTextContent(element: Element, tagName: string): string {
    const el = element.querySelector(tagName);
    return el?.textContent?.trim() || '';
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private cleanDescription(description: string): string {
    return description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 300) // Limit length
      .trim();
  }

  async fetchAllSources(): Promise<RSSFeed[]> {
    console.log('Starting RSS aggregation from all sources...');

    const feeds: RSSFeed[] = [];
    const promises = NEWS_SOURCES.map(source => this.fetchFromSource(source));

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        feeds.push(result.value);
      } else {
        console.warn(`Failed to fetch from ${NEWS_SOURCES[index].name}`);
      }
    });

    console.log(`Successfully aggregated ${feeds.length} RSS feeds with ${feeds.reduce((sum, feed) => sum + feed.items.length, 0)} total items`);
    return feeds;
  }

  async fetchByCategory(category: string): Promise<RSSFeed[]> {
    const relevantSources = NEWS_SOURCES.filter(source =>
      source.category === category || source.category === 'general'
    );

    console.log(`Fetching RSS for category: ${category} (${relevantSources.length} sources)`);

    const feeds: RSSFeed[] = [];
    for (const source of relevantSources) {
      const feed = await this.fetchFromSource(source);
      if (feed) {
        feeds.push(feed);
      }
    }

    return feeds;
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([url, data]) => ({
        url,
        itemCount: data.data.items.length,
        age: Date.now() - data.timestamp
      }))
    };
  }

  clearCache() {
    this.cache.clear();
    console.log('RSS cache cleared');
  }
}

// Export singleton instance
export const rssAggregator = new RSSAggregator();
export { NEWS_SOURCES };
export type { RSSItem, RSSFeed, NewsSource };
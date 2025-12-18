// Main News Aggregator Service
// Orchestrates RSS feeds, social media, and content processing

import { rssAggregator, RSSFeed, RSSItem } from './rssService';
import { NewsStory, SystemAlert } from '../../types';

interface AggregatedNewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  category: string;
  priority: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  processed: boolean;
  duplicateOf?: string;
}

interface AggregationResult {
  news: NewsStory[];
  alerts: SystemAlert[];
  stats: {
    totalFetched: number;
    processed: number;
    duplicates: number;
    errors: number;
  };
}

class NewsAggregator {
  private processedUrls = new Set<string>();
  private contentCache = new Map<string, AggregatedNewsItem>();

  async aggregateAllSources(): Promise<AggregationResult> {
    console.log('🚀 Starting comprehensive news aggregation...');

    const startTime = Date.now();
    let totalFetched = 0;
    let processed = 0;
    let duplicates = 0;
    let errors = 0;

    try {
      // Phase 1: RSS Feeds
      console.log('📡 Phase 1: Fetching RSS feeds...');
      const rssFeeds = await rssAggregator.fetchAllSources();
      const rssItems = rssFeeds.flatMap(feed => feed.items);
      totalFetched += rssItems.length;

      // Phase 2: Social Media (placeholder for now)
      console.log('🐦 Phase 2: Social media integration (coming soon)...');

      // Phase 3: Content Processing
      console.log('🧠 Phase 3: Processing and deduplicating content...');
      const processedItems = await this.processItems(rssItems);

      processed = processedItems.length;
      duplicates = totalFetched - processed;

      // Phase 4: Convert to app format
      console.log('📝 Phase 4: Converting to app format...');
      const { news, alerts } = this.convertToAppFormat(processedItems);

      const duration = Date.now() - startTime;
      console.log(`✅ Aggregation complete in ${duration}ms:`, {
        totalFetched,
        processed,
        duplicates,
        newsCount: news.length,
        alertsCount: alerts.length
      });

      return {
        news,
        alerts,
        stats: { totalFetched, processed, duplicates, errors }
      };

    } catch (error) {
      console.error('❌ News aggregation failed:', error);
      errors++;
      return {
        news: [],
        alerts: [],
        stats: { totalFetched, processed, duplicates, errors }
      };
    }
  }

  private async processItems(rssItems: RSSItem[]): Promise<AggregatedNewsItem[]> {
    const processed: AggregatedNewsItem[] = [];

    for (const item of rssItems) {
      try {
        // Check for duplicates
        if (this.processedUrls.has(item.link)) {
          continue;
        }

        // Basic deduplication by title similarity (simple approach)
        const isDuplicate = this.checkDuplicate(item.title);
        if (isDuplicate) {
          continue;
        }

        // Extract image from description or enclosure
        const imageUrl = this.extractImageUrl(item);

        // Determine category and tags
        const { category, tags } = this.categorizeContent(item);

        // Calculate priority based on source and content
        const priority = this.calculatePriority(item, category);

        const processedItem: AggregatedNewsItem = {
          id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: item.title,
          summary: this.generateSummary(item.description),
          content: item.description,
          source: this.extractSourceName(item.link),
          sourceUrl: item.link,
          publishedAt: this.parseDate(item.pubDate),
          imageUrl,
          tags,
          category,
          priority,
          engagement: {
            likes: Math.floor(Math.random() * 100), // Placeholder
            shares: Math.floor(Math.random() * 20),  // Placeholder
            comments: Math.floor(Math.random() * 50) // Placeholder
          },
          processed: true
        };

        processed.push(processedItem);
        this.processedUrls.add(item.link);
        this.contentCache.set(item.link, processedItem);

      } catch (error) {
        console.warn('Error processing RSS item:', error);
      }
    }

    // Sort by priority and recency
    return processed.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  private checkDuplicate(title: string): boolean {
    // Simple duplicate detection based on title similarity
    const normalizedTitle = title.toLowerCase().replace(/[^\w\s]/g, '');
    for (const existing of this.contentCache.values()) {
      const existingNormalized = existing.title.toLowerCase().replace(/[^\w\s]/g, '');
      const similarity = this.calculateSimilarity(normalizedTitle, existingNormalized);
      if (similarity > 0.8) { // 80% similarity threshold
        return true;
      }
    }
    return false;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  private extractImageUrl(item: RSSItem): string | undefined {
    // Try enclosure first
    if (item.enclosure?.type?.startsWith('image/')) {
      return item.enclosure.url;
    }

    // Try to extract from description
    const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }

    return undefined;
  }

  private categorizeContent(item: RSSItem): { category: string; tags: string[] } {
    const title = item.title.toLowerCase();
    const description = item.description.toLowerCase();
    const text = `${title} ${description}`;

    const tags: string[] = [];

    // Sport detection
    if (text.includes('nfl') || text.includes('football') && text.includes('american')) {
      tags.push('NFL');
    }
    if (text.includes('nba') || text.includes('basketball')) {
      tags.push('NBA');
    }
    if (text.includes('mlb') || text.includes('baseball')) {
      tags.push('MLB');
    }
    if (text.includes('nhl') || text.includes('hockey')) {
      tags.push('NHL');
    }
    if (text.includes('soccer') || text.includes('premier league') || text.includes('champions league')) {
      tags.push('Soccer');
    }
    if (text.includes('ufc') || text.includes('mma') || text.includes('fighting')) {
      tags.push('UFC');
    }
    if (text.includes('f1') || text.includes('formula 1') || text.includes('motorsport')) {
      tags.push('F1');
    }

    // Content type detection
    if (text.includes('transfer') || text.includes('signing') || text.includes('contract')) {
      tags.push('Transfers');
    }
    if (text.includes('injury') || text.includes('injured')) {
      tags.push('Injuries');
    }
    if (text.includes('trade') || text.includes('draft')) {
      tags.push('Trades');
    }
    if (text.includes('highlight') || text.includes('video')) {
      tags.push('Highlights');
    }

    // Determine primary category
    let category = 'general';
    if (tags.includes('Soccer')) category = 'soccer';
    else if (tags.includes('NFL')) category = 'nfl';
    else if (tags.includes('NBA')) category = 'nba';
    else if (tags.includes('MLB')) category = 'mlb';
    else if (tags.includes('NHL')) category = 'nhl';
    else if (tags.includes('UFC')) category = 'ufc';
    else if (tags.includes('F1')) category = 'f1';

    return { category, tags };
  }

  private calculatePriority(item: RSSItem, category: string): number {
    let priority = 5; // Base priority

    // Source priority
    const source = this.extractSourceName(item.link).toLowerCase();
    if (source.includes('espn')) priority += 3;
    else if (source.includes('sky')) priority += 2;
    else if (source.includes('bbc')) priority += 2;

    // Content priority
    const title = item.title.toLowerCase();
    if (title.includes('breaking') || title.includes('exclusive')) priority += 2;
    if (title.includes('transfer') || title.includes('signing')) priority += 1;
    if (title.includes('injury')) priority += 1;

    // Recency bonus (newer = higher priority)
    const pubDate = new Date(item.pubDate);
    const hoursOld = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 1) priority += 3;
    else if (hoursOld < 6) priority += 2;
    else if (hoursOld < 24) priority += 1;

    return Math.min(priority, 10); // Cap at 10
  }

  private generateSummary(description: string): string {
    // Extract first 150 characters as summary
    const cleanDesc = description.replace(/<[^>]*>/g, '').trim();
    if (cleanDesc.length <= 150) return cleanDesc;

    const truncated = cleanDesc.substring(0, 150);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  private extractSourceName(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      const parts = domain.split('.');
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return 'Unknown';
    }
  }

  private parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private convertToAppFormat(items: AggregatedNewsItem[]): { news: NewsStory[]; alerts: SystemAlert[] } {
    const news: NewsStory[] = [];
    const alerts: SystemAlert[] = [];

    for (const item of items) {
      // Convert to NewsStory format
      const newsStory: NewsStory = {
        id: item.id,
        type: 'NEWS',
        title: item.title,
        summary: item.summary,
        imageUrl: item.imageUrl || '',
        source: item.source,
        author: item.source,
        timestamp: new Date(item.publishedAt).toLocaleDateString(),
        likes: item.engagement.likes,
        comments: item.engagement.comments,
        tags: item.tags,
        contentBlocks: [
          {
            type: 'TEXT',
            content: item.content
          }
        ],
        entities: [], // Will be populated by entity recognition
        contentTags: [], // Will be populated by content analysis
        isHero: item.priority >= 8,
        readingTimeMinutes: Math.ceil(item.content.split(' ').length / 200)
      };

      news.push(newsStory);

      // Create alerts for high-priority breaking news
      if (item.priority >= 9 && item.title.toLowerCase().includes('breaking')) {
        const alert: SystemAlert = {
          id: `alert_${item.id}`,
          type: 'SYSTEM_ALERT',
          alertType: 'SHARP_MONEY',
          title: 'Breaking News Alert',
          description: item.title,
          dataPoint: item.source,
          league: item.category,
          timestamp: item.publishedAt,
          signalStrength: 'HIGH',
          actionableBet: 'Check latest odds'
        };
        alerts.push(alert);
      }
    }

    return { news, alerts };
  }

  // Manual trigger for testing
  async testAggregation(): Promise<AggregationResult> {
    console.log('🧪 Running test aggregation...');
    return this.aggregateAllSources();
  }

  getCacheStats() {
    return {
      rssCache: rssAggregator.getCacheStats(),
      processedUrls: this.processedUrls.size,
      contentCache: this.contentCache.size
    };
  }

  clearAllCache() {
    rssAggregator.clearCache();
    this.processedUrls.clear();
    this.contentCache.clear();
    console.log('All news aggregation caches cleared');
  }
}

// Export singleton instance
export const newsAggregator = new NewsAggregator();
export type { AggregatedNewsItem, AggregationResult };
# Founder OS - Advanced Features

## 🎯 New Features Implemented

### 1. Content Calendar View
**Location:** `/dashboard/calendar`

A visual calendar interface for scheduling and managing content publishing.

**Features:**
- Week-by-week view with navigation
- Click any date to schedule content
- Visual indicators for scheduled posts
- Platform badges (LinkedIn, Twitter, Instagram)
- Time display for each scheduled post
- Easy scheduling dialog with approved drafts

**How to Use:**
1. Navigate to Calendar from the dashboard
2. Click the "+" button on any date
3. Select approved content draft
4. Choose platform (LinkedIn, Twitter/X, Instagram)
5. Set date and time
6. Click "Schedule"

### 2. Analytics Dashboard
**Location:** `/dashboard/analytics`

Comprehensive analytics tracking for published content.

**Features:**
- Total views, engagement, clicks across all platforms
- Engagement rate calculation
- Platform-specific performance breakdown
- Top performing posts
- Detailed metrics (impressions, likes, comments, shares)
- Real-time analytics sync

**Metrics Tracked:**
- Views/Impressions
- Likes
- Comments
- Shares
- Clicks
- Engagement Rate

**How to Use:**
1. Navigate to Analytics from dashboard
2. View aggregated metrics
3. Check platform-specific performance
4. Review top performing content
5. Use "Sync Analytics" to update metrics from platforms

### 3. Social Media Publishing Integrations

#### LinkedIn Integration
**Location:** Settings → LinkedIn Integration

**Features:**
- Direct publishing to LinkedIn
- Image support
- Automatic post creation
- Analytics tracking

**Setup:**
1. Go to Settings
2. Navigate to LinkedIn Integration
3. Enter your LinkedIn Access Token
4. Click "Connect LinkedIn"

**Publishing:**
- Content is automatically published at scheduled time
- Supports text and images
- Tracks post ID for analytics

#### Twitter/X Integration
**Location:** Settings → Twitter/X Integration

**Features:**
- Direct publishing to Twitter/X
- Image upload support
- Character limit handling (280 chars)
- Analytics tracking

**Setup:**
1. Go to Settings
2. Navigate to Twitter/X Integration
3. Enter your Twitter Bearer Token
4. Click "Connect Twitter/X"

**Publishing:**
- Content is automatically published at scheduled time
- Automatically truncates to 280 characters
- Supports images
- Tracks tweet ID for analytics

### 4. n8n Automation Integration
**Location:** `/api/webhooks/n8n`

Webhook endpoint for n8n automation workflows.

**Features:**
- Automated publishing of scheduled content
- Analytics synchronization
- Webhook secret authentication
- Error handling and logging

**Available Actions:**
1. `publish_scheduled` - Publishes content when scheduled time arrives
2. `sync_analytics` - Syncs analytics from platforms

**n8n Workflow Setup:**
1. Create a new n8n workflow
2. Add HTTP Request node
3. Set URL to: `https://your-domain.com/api/webhooks/n8n`
4. Method: POST
5. Body:
```json
{
  "action": "publish_scheduled",
  "scheduleId": "schedule_id_here",
  "webhookSecret": "your_webhook_secret"
}
```

**Environment Variable:**
Add to `.env`:
```
N8N_WEBHOOK_SECRET=your_secure_secret_here
```

**Example n8n Workflow:**
- Cron trigger (every hour)
- HTTP Request to check pending schedules
- Filter schedules ready to publish
- HTTP Request to publish endpoint
- Error handling

## 📊 Database Schema Updates

New models added:
- **Analytics** - Tracks metrics for published content
  - Views, likes, comments, shares, clicks
  - Engagement rate calculation
  - Platform-specific metrics
  - Timestamped records

Updated models:
- **Schedule** - Added `externalId` for platform post IDs
- **Integration** - Supports LinkedIn and Twitter tokens

## 🔄 Workflow

### Complete Publishing Flow:

1. **Create Activity** → Manual input or GitHub sync
2. **Extract Insight** → AI-powered insight extraction
3. **Generate Content** → Create posts, blogs, carousels
4. **Review & Approve** → Human approval required
5. **Schedule** → Set date/time in calendar
6. **Auto-Publish** → n8n or manual publishing
7. **Track Analytics** → View performance metrics

### Automation Flow (n8n):

1. n8n cron triggers hourly
2. Checks for pending schedules
3. Publishes when time arrives
4. Updates schedule status
5. Syncs analytics
6. Logs errors if any

## 🛠️ API Endpoints

### New Endpoints:

- `POST /api/schedules` - Create schedule
- `GET /api/schedules` - Get schedules (with date range)
- `DELETE /api/schedules/[id]` - Delete schedule
- `POST /api/publish` - Manually publish content
- `GET /api/analytics` - Get analytics data
- `POST /api/analytics/sync` - Sync analytics from platforms
- `POST /api/webhooks/n8n` - n8n webhook endpoint
- `POST /api/integrations/linkedin` - Connect LinkedIn
- `POST /api/integrations/twitter` - Connect Twitter

## 📝 Usage Examples

### Scheduling Content:
```typescript
// Via API
POST /api/schedules
{
  "contentDraftId": "draft_id",
  "platform": "linkedin",
  "scheduledAt": "2024-01-15T09:00:00Z"
}
```

### Publishing Manually:
```typescript
POST /api/publish
{
  "scheduleId": "schedule_id"
}
```

### Syncing Analytics:
```typescript
POST /api/analytics/sync
{
  "scheduleId": "schedule_id"
}
```

## 🔐 Security

- Webhook secret authentication for n8n
- User-scoped data access
- Integration token encryption (stored securely)
- Error message sanitization

## 🚀 Next Steps

1. **Set up n8n workflow:**
   - Install n8n (self-hosted or cloud)
   - Create workflow with cron trigger
   - Configure webhook endpoint
   - Test publishing flow

2. **Connect social platforms:**
   - Get API keys from LinkedIn Developer Portal
   - Get API keys from Twitter Developer Portal
   - Add tokens in Settings

3. **Schedule content:**
   - Approve content drafts
   - Use Calendar to schedule
   - Monitor in Analytics

4. **Monitor performance:**
   - Check Analytics dashboard regularly
   - Sync analytics from platforms
   - Review top performing content

## 📚 Additional Resources

- [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [n8n Documentation](https://docs.n8n.io/)

---

All features are production-ready and follow the core principles:
- Human control at critical points
- No fake automation
- Honest, signal-based content
- Founder-first approach

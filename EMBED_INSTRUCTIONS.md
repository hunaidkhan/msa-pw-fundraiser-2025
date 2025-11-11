# Leaderboard Embed Widget

This document explains how to embed the fundraising leaderboard on external websites.

## 🎯 What is it?

An embeddable widget that displays all fundraising teams ranked by total funds raised (highest first). The leaderboard updates automatically every 60 seconds.

## 🚀 Embedding Options

### Option 1: iframe Embed (Easiest)

Add this HTML code to any webpage:

```html
<iframe
  src="https://your-domain.com/embed/leaderboard"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
  title="Fundraising Leaderboard"
></iframe>
```

**Responsive sizing:**

```html
<div style="width: 100%; max-width: 900px; margin: 0 auto;">
  <iframe
    src="https://your-domain.com/embed/leaderboard"
    width="100%"
    height="800"
    frameborder="0"
    style="border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
    title="Fundraising Leaderboard"
  ></iframe>
</div>
```

### Option 2: JSON API (For Custom Integrations)

Fetch leaderboard data programmatically:

**Endpoint:** `https://your-domain.com/api/leaderboard`

**Method:** `GET`

**Response format:**
```json
{
  "success": true,
  "updatedAt": "2025-11-11T10:30:00.000Z",
  "leaderboard": [
    {
      "rank": 1,
      "id": "team-abc",
      "slug": "team-abc",
      "name": "Team ABC",
      "logoUrl": "https://...",
      "fundraisingRaised": 50000,
      "fundraisingGoal": 100000,
      "progress": 50
    },
    ...
  ]
}
```

**Field descriptions:**
- `rank`: Position in the leaderboard (1 = first place)
- `fundraisingRaised`: Amount raised in cents (50000 = $500.00)
- `fundraisingGoal`: Goal amount in cents (optional)
- `progress`: Percentage of goal completed (0-100)

**JavaScript example:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Custom Leaderboard</title>
  <style>
    .leaderboard-item {
      padding: 15px;
      margin: 10px 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .rank {
      font-size: 24px;
      font-weight: bold;
      margin-right: 15px;
    }
    .amount {
      font-size: 20px;
      color: #059669;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div id="leaderboard"></div>

  <script>
    async function loadLeaderboard() {
      try {
        const response = await fetch('https://your-domain.com/api/leaderboard');
        const data = await response.json();

        if (!data.success) {
          throw new Error('Failed to load leaderboard');
        }

        const container = document.getElementById('leaderboard');
        container.innerHTML = data.leaderboard.map(team => `
          <div class="leaderboard-item">
            <div style="display: flex; align-items: center;">
              <span class="rank">#${team.rank}</span>
              ${team.logoUrl ? `<img src="${team.logoUrl}" alt="${team.name}" width="40" height="40" style="border-radius: 8px; margin-right: 12px;">` : ''}
              <strong>${team.name}</strong>
            </div>
            <span class="amount">$${(team.fundraisingRaised / 100).toLocaleString()}</span>
          </div>
        `).join('');

      } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboard').innerHTML =
          '<p>Failed to load leaderboard. Please try again later.</p>';
      }
    }

    // Load initially
    loadLeaderboard();

    // Refresh every 60 seconds
    setInterval(loadLeaderboard, 60000);
  </script>
</body>
</html>
```

## 🎨 Customization

### iframe Styling

You can customize the iframe appearance with CSS:

```css
iframe {
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  iframe {
    height: 600px;
  }
}
```

### URL Parameters

The embed currently supports these automatic features:
- Auto-refresh every 60 seconds
- Responsive design
- Real-time ranking updates

## 🔒 CORS Support

The API endpoint includes proper CORS headers, allowing requests from any domain. No authentication is required for public leaderboard data.

## 📊 Data Freshness

- **Cache duration**: 60 seconds (with stale-while-revalidate for 120 seconds)
- **Update frequency**: Data refreshes automatically every minute
- **Real-time updates**: Donation totals are updated immediately via webhook

## 🧪 Testing

Test the embed locally:

1. **iframe embed**: Visit `http://localhost:3000/embed/leaderboard`
2. **JSON API**: Visit `http://localhost:3000/api/leaderboard` or use curl:

```bash
curl http://localhost:3000/api/leaderboard
```

## 📱 Mobile Support

Both embedding methods are fully responsive and work on:
- Desktop browsers
- Tablets
- Mobile devices (iOS and Android)

## ⚡ Performance

- Server-side rendered for fast initial load
- Optimized with React `cache()` to deduplicate requests
- Cached responses reduce server load
- Lightweight design (~15KB HTML + CSS)

## 🔗 Live URLs

Once deployed, replace `your-domain.com` with your actual domain:

- **iframe URL**: `https://your-domain.com/embed/leaderboard`
- **API URL**: `https://your-domain.com/api/leaderboard`

## 📝 Example Use Cases

1. **Organization website**: Embed on homepage to show fundraising progress
2. **Event landing page**: Display real-time competition between teams
3. **Social media**: Share the embed URL directly
4. **Digital signage**: Display on screens at events
5. **Custom dashboards**: Fetch JSON data to build custom visualizations

## 🐛 Troubleshooting

**Issue**: iframe doesn't load
- **Solution**: Check that the URL is correct and the site is deployed

**Issue**: Old data showing
- **Solution**: Wait 60 seconds for cache to refresh, or hard refresh the page

**Issue**: CORS errors in custom integration
- **Solution**: Ensure you're using the `/api/leaderboard` endpoint (CORS is enabled)

---

Need help? Check the [main documentation](README.md) or open an issue.

# Alberta Company Finder

A production-quality OSINT tool for discovering tech companies in Alberta, Canada that match your professional profile. Uses legal search APIs (Google Custom Search or SerpAPI) with caching, rate limiting, and intelligent scoring.

## Features

- **Dual API Support**: Google Custom Search API or SerpAPI
- **Intelligent Scoring**: Matches companies based on tech stack, domain, and role keywords
- **Smart Caching**: SQLite-based caching to avoid repeated API calls (24-hour TTL)
- **Rate Limiting**: Built-in rate limiting to respect API quotas
- **Robust Error Handling**: Retry logic, timeout handling, graceful degradation
- **Flexible Output**: CSV + JSON with city grouping
- **CLI Interface**: Full argparse support with sensible defaults

## Installation

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install requests

# Or with requirements.txt
pip install -r requirements.txt
```

### requirements.txt

```
requests>=2.28.0
```

## API Setup

### Option 1: Google Custom Search API (Recommended)

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the "Custom Search API"

2. **Get an API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - (Optional) Restrict the key to Custom Search API only

3. **Create a Programmable Search Engine**:
   - Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
   - Click "Add" to create a new search engine
   - Under "Sites to search", select "Search the entire web"
   - Get your Search Engine ID (cx parameter)

4. **Set Environment Variables**:
   ```bash
   export GOOGLE_API_KEY="your-api-key-here"
   export GOOGLE_SEARCH_ENGINE_ID="your-search-engine-id"
   ```

**Pricing**: 100 free queries/day, then $5 per 1000 queries.

### Option 2: SerpAPI

1. **Sign up** at [SerpAPI](https://serpapi.com/)
2. **Get your API key** from the dashboard
3. **Set Environment Variable**:
   ```bash
   export SERPAPI_KEY="your-serpapi-key"
   ```

**Pricing**: 100 free searches/month, paid plans start at $50/month.

## Usage

### Basic Usage

```bash
# Search all of Alberta (default)
python alberta_company_finder.py

# Search Calgary only
python alberta_company_finder.py --city calgary

# Search Edmonton only
python alberta_company_finder.py --city edmonton

# Limit results
python alberta_company_finder.py --limit 30

# Custom output filename
python alberta_company_finder.py --output my_results
```

### API Selection

```bash
# Use Google Custom Search (default)
python alberta_company_finder.py --api google

# Use SerpAPI
python alberta_company_finder.py --api serpapi
```

### Advanced Options

```bash
# Verbose logging
python alberta_company_finder.py -v

# Dry run (show queries without making API calls)
python alberta_company_finder.py --dry-run

# Custom cache directory
python alberta_company_finder.py --cache-dir /path/to/cache

# Disable caching (not recommended)
python alberta_company_finder.py --no-cache
```

### Full Example

```bash
# Set API credentials
export GOOGLE_API_KEY="AIza..."
export GOOGLE_SEARCH_ENGINE_ID="a1b2c3..."

# Run comprehensive Calgary search
python alberta_company_finder.py \
    --city calgary \
    --limit 50 \
    --output calgary_tech_companies \
    --verbose
```

## Output Format

### CSV Output (`alberta_companies.csv`)

| Column | Description |
|--------|-------------|
| company_name | Extracted company name |
| city | Calgary, Edmonton, or Other Alberta |
| province | Always "Alberta" |
| industry_tags | Comma-separated tags (AI/ML, CleanTech, etc.) |
| why_match | 1-2 sentence match explanation |
| likely_roles | Suggested roles based on profile |
| website | Company website URL |
| careers_url | Detected or inferred careers page |
| evidence_sources | URLs that led to this match |
| confidence_score | 0-100 matching score |

### JSON Output (`alberta_companies.json`)

```json
{
  "generated_at": "2024-01-15T10:30:00",
  "total_companies": 45,
  "by_city": {
    "Calgary": [...],
    "Edmonton": [...],
    "Other Alberta": [...]
  },
  "all_companies": [...]
}
```

## Scoring Logic

Companies are scored on a 0-100 scale:

| Category | Points | Cap |
|----------|--------|-----|
| Primary tech keywords (AI, ML, cloud, etc.) | 10 each | 50 |
| Domain keywords (cleantech, energy, etc.) | 8 each | 30 |
| Role keywords (software engineer, etc.) | 5 each | 20 |
| Careers/hiring page detected | +10 | - |
| Staffing agency signals | -30 | - |

### Keyword Categories

**Primary (Tech Focus)**:
- AI, ML, machine learning, data science
- Backend, distributed systems, cloud
- AWS, GCP, Azure, Kubernetes
- API, microservices, event-driven

**Domain (Industry)**:
- CleanTech, EV, electric vehicle
- Smart city, IoT, GovTech
- Energy, utilities, oil and gas
- HealthTech, SaaS, GIS

**Roles**:
- Software Engineer, Backend Engineer
- Platform Engineer, ML Engineer
- Data Engineer, Systems Engineer

## Caching

The tool uses SQLite for caching API responses:

- **Cache location**: `.alberta_company_cache.db` in the current directory
- **TTL**: 24 hours by default
- **Auto-cleanup**: Expired entries are removed on startup

To clear the cache manually:
```bash
rm .alberta_company_cache.db
```

## Rate Limiting

- **Default**: 1 request per second
- **Automatic backoff**: Retries with exponential backoff on 429/5xx errors
- **Respects API quotas**: Works within free tier limits

## Legal & Ethical Notes

This tool:
- Uses only public, legal search APIs (no scraping)
- Respects robots.txt and API terms of service
- Does not access LinkedIn or other restricted platforms
- Caches results to minimize API calls
- Implements rate limiting to avoid abuse

## Troubleshooting

### "Missing Google API credentials"
Ensure both environment variables are set:
```bash
echo $GOOGLE_API_KEY
echo $GOOGLE_SEARCH_ENGINE_ID
```

### "No companies found"
- Try `--dry-run` to verify queries
- Check if API credentials are valid
- Try `--verbose` for detailed logging
- Consider broadening city filter with `--city all`

### "Rate limit exceeded"
- The tool automatically handles 429 errors with retry
- Consider using caching (default) to avoid repeated calls
- Wait and retry after quota resets

### Cache issues
Clear the cache database:
```bash
rm .alberta_company_cache.db
```

## Extending the Tool

### Adding New Keywords

Edit the `ProfileConfig` class in the script:

```python
@dataclass
class ProfileConfig:
    primary_keywords: list[str] = field(default_factory=lambda: [
        # Add your keywords here
        "your_new_keyword",
        ...
    ])
```

### Adding New Industries

Update the `domain_keywords` list and the `tag_mapping` dictionary in `extract_industry_tags()`.

### Custom Scoring

Modify the `score_result()` method in `CompanyScorer` to adjust weights.

## License

MIT License - Use freely for job searching and professional research.

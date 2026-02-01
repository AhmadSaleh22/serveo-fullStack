#!/usr/bin/env python3
"""
Alberta Company Finder - OSINT Tool for Job Seekers

A production-quality script to find companies in Alberta, Canada matching
specific technical profiles using legal search APIs.

Author: Job Search Automation Tool
License: MIT
"""

import argparse
import csv
import hashlib
import json
import logging
import os
import re
import sqlite3
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse, quote_plus

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# =============================================================================
# Configuration & Constants
# =============================================================================

class City(Enum):
    CALGARY = "calgary"
    EDMONTON = "edmonton"
    ALL = "all"


@dataclass
class ProfileConfig:
    """Configuration for the target job seeker profile."""

    # High-value keywords (strong signal)
    primary_keywords: list[str] = field(default_factory=lambda: [
        "artificial intelligence", "machine learning", "AI", "ML",
        "data science", "data engineering", "data pipeline",
        "backend", "platform engineer", "distributed systems",
        "cloud", "AWS", "GCP", "Azure", "kubernetes",
        "API", "microservices", "event-driven",
    ])

    # Domain/industry keywords
    domain_keywords: list[str] = field(default_factory=lambda: [
        "cleantech", "clean tech", "clean energy",
        "EV", "electric vehicle", "charging",
        "smart city", "smart cities", "IoT",
        "govtech", "government technology",
        "energy", "utilities", "oil and gas", "oilfield",
        "healthtech", "health tech", "healthcare",
        "SaaS", "enterprise software",
        "GIS", "geospatial", "mapping",
    ])

    # Role keywords
    role_keywords: list[str] = field(default_factory=lambda: [
        "software engineer", "backend engineer", "platform engineer",
        "ML engineer", "machine learning engineer", "applied ML",
        "systems engineer", "data engineer", "infrastructure engineer",
        "senior engineer", "staff engineer", "principal engineer",
    ])

    # Negative signals (staffing/recruiting agencies)
    negative_keywords: list[str] = field(default_factory=lambda: [
        "staffing agency", "recruitment agency", "recruiting firm",
        "temp agency", "employment agency", "headhunter",
        "contract staffing", "talent acquisition firm",
    ])


@dataclass
class SearchConfig:
    """Configuration for search parameters."""

    # Search query templates
    location_terms: list[str] = field(default_factory=lambda: [
        "Calgary", "Edmonton", "Alberta"
    ])

    tech_terms: list[str] = field(default_factory=lambda: [
        "AI", "machine learning", "data", "software",
        "platform", "cloud", "technology", "tech"
    ])

    hiring_terms: list[str] = field(default_factory=lambda: [
        "careers", "jobs", "we're hiring", "join our team",
        "open positions", "work with us"
    ])


# =============================================================================
# Caching Layer (SQLite)
# =============================================================================

class CacheManager:
    """SQLite-based caching for API responses."""

    def __init__(self, cache_path: str = ".alberta_company_cache.db"):
        self.cache_path = cache_path
        self._init_db()

    def _init_db(self):
        """Initialize the cache database."""
        with sqlite3.connect(self.cache_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS search_cache (
                    query_hash TEXT PRIMARY KEY,
                    query_text TEXT,
                    response_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_expires
                ON search_cache(expires_at)
            """)
            conn.commit()

    def _hash_query(self, query: str) -> str:
        """Generate a hash for the query string."""
        return hashlib.sha256(query.encode()).hexdigest()[:32]

    def get(self, query: str) -> Optional[dict]:
        """Retrieve cached response if valid."""
        query_hash = self._hash_query(query)

        with sqlite3.connect(self.cache_path) as conn:
            cursor = conn.execute(
                """
                SELECT response_json FROM search_cache
                WHERE query_hash = ? AND expires_at > ?
                """,
                (query_hash, datetime.now().isoformat())
            )
            row = cursor.fetchone()

            if row:
                logger.debug(f"Cache hit for query: {query[:50]}...")
                return json.loads(row[0])

        return None

    def set(self, query: str, response: dict, ttl_hours: int = 24):
        """Store response in cache."""
        query_hash = self._hash_query(query)
        expires_at = datetime.now() + timedelta(hours=ttl_hours)

        with sqlite3.connect(self.cache_path) as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO search_cache
                (query_hash, query_text, response_json, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                (query_hash, query, json.dumps(response), expires_at.isoformat())
            )
            conn.commit()

        logger.debug(f"Cached response for query: {query[:50]}...")

    def clear_expired(self):
        """Remove expired cache entries."""
        with sqlite3.connect(self.cache_path) as conn:
            cursor = conn.execute(
                "DELETE FROM search_cache WHERE expires_at < ?",
                (datetime.now().isoformat(),)
            )
            conn.commit()
            logger.info(f"Cleared {cursor.rowcount} expired cache entries")


# =============================================================================
# Rate Limiter
# =============================================================================

class RateLimiter:
    """Simple rate limiter for API calls."""

    def __init__(self, calls_per_second: float = 1.0):
        self.min_interval = 1.0 / calls_per_second
        self.last_call_time = 0.0

    def wait(self):
        """Wait if necessary to respect rate limit."""
        elapsed = time.time() - self.last_call_time
        if elapsed < self.min_interval:
            sleep_time = self.min_interval - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
        self.last_call_time = time.time()


# =============================================================================
# Search API Clients
# =============================================================================

class SearchAPIClient:
    """Base class for search API clients."""

    def __init__(self, cache: CacheManager, rate_limiter: RateLimiter):
        self.cache = cache
        self.rate_limiter = rate_limiter
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Create a requests session with retry logic."""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session

    def search(self, query: str, num_results: int = 10) -> list[dict]:
        """Execute search query. To be implemented by subclasses."""
        raise NotImplementedError


class GoogleCustomSearchClient(SearchAPIClient):
    """Google Custom Search API client."""

    API_URL = "https://www.googleapis.com/customsearch/v1"

    def __init__(
        self,
        api_key: str,
        search_engine_id: str,
        cache: CacheManager,
        rate_limiter: RateLimiter,
    ):
        super().__init__(cache, rate_limiter)
        self.api_key = api_key
        self.search_engine_id = search_engine_id

    def search(self, query: str, num_results: int = 10) -> list[dict]:
        """Execute Google Custom Search query."""
        results = []

        # Google CSE returns max 10 results per request
        for start in range(1, min(num_results + 1, 101), 10):
            cache_key = f"google:{query}:start={start}"

            # Check cache first
            cached = self.cache.get(cache_key)
            if cached:
                results.extend(cached.get("items", []))
                continue

            # Make API request
            self.rate_limiter.wait()

            try:
                params = {
                    "key": self.api_key,
                    "cx": self.search_engine_id,
                    "q": query,
                    "start": start,
                    "num": min(10, num_results - len(results)),
                }

                response = self.session.get(self.API_URL, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()

                # Cache the response
                self.cache.set(cache_key, data)
                results.extend(data.get("items", []))

                # Check if there are more results
                if "nextPage" not in data.get("queries", {}):
                    break

            except requests.exceptions.RequestException as e:
                logger.error(f"Google API error: {e}")
                break

        return results[:num_results]


class SerpAPIClient(SearchAPIClient):
    """SerpAPI client for Google search results."""

    API_URL = "https://serpapi.com/search"

    def __init__(
        self,
        api_key: str,
        cache: CacheManager,
        rate_limiter: RateLimiter,
    ):
        super().__init__(cache, rate_limiter)
        self.api_key = api_key

    def search(self, query: str, num_results: int = 10) -> list[dict]:
        """Execute SerpAPI search query."""
        results = []
        start = 0

        while len(results) < num_results:
            cache_key = f"serpapi:{query}:start={start}"

            # Check cache first
            cached = self.cache.get(cache_key)
            if cached:
                organic = cached.get("organic_results", [])
                results.extend(organic)
                start += 10
                if not organic:
                    break
                continue

            # Make API request
            self.rate_limiter.wait()

            try:
                params = {
                    "api_key": self.api_key,
                    "engine": "google",
                    "q": query,
                    "start": start,
                    "num": 10,
                    "gl": "ca",  # Canada
                    "hl": "en",
                }

                response = self.session.get(self.API_URL, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()

                # Cache the response
                self.cache.set(cache_key, data)

                organic = data.get("organic_results", [])
                results.extend(organic)

                if not organic:
                    break

                start += 10

            except requests.exceptions.RequestException as e:
                logger.error(f"SerpAPI error: {e}")
                break

        # Normalize to common format
        normalized = []
        for item in results[:num_results]:
            normalized.append({
                "title": item.get("title", ""),
                "link": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "displayLink": urlparse(item.get("link", "")).netloc,
            })

        return normalized


class DuckDuckGoClient(SearchAPIClient):
    """
    DuckDuckGo search client - NO API KEY REQUIRED.

    Uses the duckduckgo-search library for reliable access.
    Rate limited to be respectful of the service.
    """

    def __init__(self, cache: CacheManager, rate_limiter: RateLimiter):
        super().__init__(cache, rate_limiter)
        # Import here to make it optional
        try:
            from ddgs import DDGS
            self.ddgs = DDGS()
        except ImportError:
            logger.error(
                "ddgs library not installed. Run: pip install ddgs"
            )
            raise

    def search(self, query: str, num_results: int = 10) -> list[dict]:
        """Execute DuckDuckGo search query."""
        cache_key = f"ddg:{query}"

        # Check cache first
        cached = self.cache.get(cache_key)
        if cached:
            return cached[:num_results]

        # Rate limit
        self.rate_limiter.wait()

        try:
            # Use the duckduckgo-search library
            raw_results = list(self.ddgs.text(
                query,
                region="ca-en",  # Canada English
                max_results=num_results,
            ))

            # Normalize to common format
            results = []
            for item in raw_results:
                results.append({
                    "title": item.get("title", ""),
                    "link": item.get("href", ""),
                    "snippet": item.get("body", ""),
                    "displayLink": urlparse(item.get("href", "")).netloc,
                })

            # Cache results
            self.cache.set(cache_key, results)

            return results[:num_results]

        except Exception as e:
            logger.error(f"DuckDuckGo search error: {e}")
            return []


# =============================================================================
# Company Scoring & Matching
# =============================================================================

@dataclass
class CompanyMatch:
    """Represents a matched company with scoring details."""

    company_name: str
    city: str
    province: str = "Alberta"
    industry_tags: list[str] = field(default_factory=list)
    why_match: str = ""
    likely_roles: list[str] = field(default_factory=list)
    website: str = ""
    careers_url: str = ""
    evidence_sources: list[str] = field(default_factory=list)
    confidence_score: int = 0

    # Internal scoring details
    _keyword_matches: dict = field(default_factory=dict, repr=False)
    _penalties: list[str] = field(default_factory=list, repr=False)

    def to_dict(self) -> dict:
        """Convert to dictionary for export."""
        return {
            "company_name": self.company_name,
            "city": self.city,
            "province": self.province,
            "industry_tags": ", ".join(self.industry_tags),
            "why_match": self.why_match,
            "likely_roles": ", ".join(self.likely_roles),
            "website": self.website,
            "careers_url": self.careers_url,
            "evidence_sources": "; ".join(self.evidence_sources),
            "confidence_score": self.confidence_score,
        }


class CompanyScorer:
    """Scores companies based on profile matching."""

    def __init__(self, profile: ProfileConfig):
        self.profile = profile

        # Compile regex patterns for efficiency
        self._primary_patterns = self._compile_patterns(profile.primary_keywords)
        self._domain_patterns = self._compile_patterns(profile.domain_keywords)
        self._role_patterns = self._compile_patterns(profile.role_keywords)
        self._negative_patterns = self._compile_patterns(profile.negative_keywords)

    def _compile_patterns(self, keywords: list[str]) -> list[tuple[str, re.Pattern]]:
        """Compile keywords into case-insensitive regex patterns."""
        patterns = []
        for kw in keywords:
            # Escape special regex chars and create word boundary pattern
            escaped = re.escape(kw)
            pattern = re.compile(rf"\b{escaped}\b", re.IGNORECASE)
            patterns.append((kw, pattern))
        return patterns

    def _count_matches(
        self,
        text: str,
        patterns: list[tuple[str, re.Pattern]]
    ) -> dict[str, int]:
        """Count keyword matches in text."""
        matches = {}
        for keyword, pattern in patterns:
            count = len(pattern.findall(text))
            if count > 0:
                matches[keyword] = count
        return matches

    def score_result(self, search_result: dict) -> tuple[int, dict]:
        """
        Score a search result based on keyword matches.

        Returns:
            Tuple of (score, match_details)
        """
        title = search_result.get("title", "")
        snippet = search_result.get("snippet", "")
        link = search_result.get("link", "")

        # Combine text for matching
        text = f"{title} {snippet} {link}"

        # Count matches
        primary_matches = self._count_matches(text, self._primary_patterns)
        domain_matches = self._count_matches(text, self._domain_patterns)
        role_matches = self._count_matches(text, self._role_patterns)
        negative_matches = self._count_matches(text, self._negative_patterns)

        # Calculate base score
        score = 0

        # Primary keywords: 10 points each (capped at 50)
        primary_score = min(len(primary_matches) * 10, 50)
        score += primary_score

        # Domain keywords: 8 points each (capped at 30)
        domain_score = min(len(domain_matches) * 8, 30)
        score += domain_score

        # Role keywords: 5 points each (capped at 20)
        role_score = min(len(role_matches) * 5, 20)
        score += role_score

        # Boost for careers/hiring pages
        if any(term in text.lower() for term in ["careers", "jobs", "hiring", "join"]):
            score += 10

        # Penalty for staffing agencies
        if negative_matches:
            score -= 30

        # Ensure score is in valid range
        score = max(0, min(100, score))

        match_details = {
            "primary": primary_matches,
            "domain": domain_matches,
            "roles": role_matches,
            "negative": negative_matches,
        }

        return score, match_details

    def generate_why_match(self, match_details: dict) -> str:
        """Generate a human-readable match explanation."""
        reasons = []

        if match_details["primary"]:
            keywords = list(match_details["primary"].keys())[:3]
            reasons.append(f"Tech focus: {', '.join(keywords)}")

        if match_details["domain"]:
            domains = list(match_details["domain"].keys())[:2]
            reasons.append(f"Domain fit: {', '.join(domains)}")

        if match_details["roles"]:
            roles = list(match_details["roles"].keys())[:2]
            reasons.append(f"Hiring for: {', '.join(roles)}")

        if not reasons:
            return "General tech company in Alberta."

        return ". ".join(reasons) + "."

    def extract_industry_tags(self, match_details: dict) -> list[str]:
        """Extract relevant industry tags from matches."""
        tags = set()

        # Map keywords to normalized tags
        tag_mapping = {
            "AI": "AI/ML",
            "artificial intelligence": "AI/ML",
            "machine learning": "AI/ML",
            "ML": "AI/ML",
            "data science": "Data Science",
            "data engineering": "Data Engineering",
            "cleantech": "CleanTech",
            "clean tech": "CleanTech",
            "clean energy": "CleanTech",
            "EV": "EV/Mobility",
            "electric vehicle": "EV/Mobility",
            "smart city": "Smart Cities",
            "smart cities": "Smart Cities",
            "govtech": "GovTech",
            "government": "GovTech",
            "energy": "Energy",
            "oil and gas": "Energy",
            "utilities": "Utilities",
            "healthtech": "HealthTech",
            "healthcare": "HealthTech",
            "SaaS": "SaaS",
            "cloud": "Cloud",
            "GIS": "GIS/Geospatial",
            "geospatial": "GIS/Geospatial",
        }

        for category in ["primary", "domain"]:
            for keyword in match_details.get(category, {}):
                normalized = tag_mapping.get(keyword.lower(), keyword.title())
                tags.add(normalized)

        return sorted(tags)[:5]  # Limit to 5 tags

    def extract_likely_roles(self, match_details: dict) -> list[str]:
        """Extract likely job roles based on matches."""
        roles = set()

        role_mapping = {
            "software engineer": "Software Engineer",
            "backend engineer": "Backend Engineer",
            "platform engineer": "Platform Engineer",
            "ML engineer": "ML Engineer",
            "machine learning engineer": "ML Engineer",
            "data engineer": "Data Engineer",
            "systems engineer": "Systems Engineer",
        }

        for keyword in match_details.get("roles", {}):
            normalized = role_mapping.get(keyword.lower(), keyword.title())
            roles.add(normalized)

        # If no specific roles found, suggest based on tech keywords
        if not roles and match_details.get("primary"):
            if any(k in str(match_details["primary"]).lower() for k in ["ai", "ml", "machine learning"]):
                roles.add("ML Engineer")
            if any(k in str(match_details["primary"]).lower() for k in ["backend", "api", "distributed"]):
                roles.add("Backend Engineer")
            if any(k in str(match_details["primary"]).lower() for k in ["platform", "cloud", "kubernetes"]):
                roles.add("Platform Engineer")

        return sorted(roles)[:4]


# =============================================================================
# Company Discovery Engine
# =============================================================================

class CompanyDiscoveryEngine:
    """Main engine for discovering and scoring companies."""

    def __init__(
        self,
        search_client: SearchAPIClient,
        scorer: CompanyScorer,
        search_config: SearchConfig,
    ):
        self.search_client = search_client
        self.scorer = scorer
        self.search_config = search_config
        self._seen_domains = set()

    def _build_queries(self, city_filter: City) -> list[str]:
        """Build search queries based on configuration."""
        queries = []

        # Determine location terms
        if city_filter == City.CALGARY:
            locations = ["Calgary Alberta"]
        elif city_filter == City.EDMONTON:
            locations = ["Edmonton Alberta"]
        else:
            locations = ["Calgary Alberta", "Edmonton Alberta", "Alberta Canada"]

        # Build query combinations
        for location in locations:
            for tech_term in self.search_config.tech_terms:
                # Tech company + hiring query
                query = f'"{location}" {tech_term} company careers'
                queries.append(query)

                # Startup/scale-up focus
                query = f'"{location}" {tech_term} startup hiring'
                queries.append(query)

        # Add domain-specific queries
        domain_queries = [
            '"Calgary" OR "Edmonton" cleantech software company',
            '"Alberta" AI machine learning startup careers',
            '"Calgary" data science platform company jobs',
            '"Edmonton" cloud software engineering team',
            '"Alberta" energy technology software company',
            '"Calgary" healthtech startup engineer',
            '"Alberta" SaaS company backend engineer',
        ]
        queries.extend(domain_queries)

        return queries

    def _extract_company_name(self, search_result: dict) -> str:
        """Extract company name from search result."""
        title = search_result.get("title", "")
        domain = search_result.get("displayLink", "")

        # Try to extract from title (often "Company Name - Careers" format)
        if " - " in title:
            name = title.split(" - ")[0].strip()
            if name and len(name) < 50:
                return name

        if " | " in title:
            name = title.split(" | ")[0].strip()
            if name and len(name) < 50:
                return name

        # Fall back to domain name
        if domain:
            # Remove www. and TLD
            name = domain.replace("www.", "").split(".")[0]
            return name.title()

        return title[:50] if title else "Unknown Company"

    def _detect_city(self, search_result: dict) -> str:
        """Detect city from search result content."""
        text = f"{search_result.get('title', '')} {search_result.get('snippet', '')}"
        text_lower = text.lower()

        if "calgary" in text_lower:
            return "Calgary"
        elif "edmonton" in text_lower:
            return "Edmonton"
        elif "alberta" in text_lower:
            return "Other Alberta"

        return "Alberta (unspecified)"

    def _extract_urls(self, search_result: dict) -> tuple[str, str]:
        """Extract website and careers URLs."""
        link = search_result.get("link", "")

        # Parse base domain
        parsed = urlparse(link)
        base_url = f"{parsed.scheme}://{parsed.netloc}"

        # Detect if this is a careers page
        careers_keywords = ["careers", "jobs", "hiring", "join", "work-with-us"]
        is_careers = any(kw in link.lower() for kw in careers_keywords)

        if is_careers:
            return base_url, link
        else:
            return link, f"{base_url}/careers"

    def discover_companies(
        self,
        city_filter: City = City.ALL,
        limit: int = 60,
    ) -> list[CompanyMatch]:
        """
        Discover and score companies matching the profile.

        Args:
            city_filter: Filter by city (Calgary, Edmonton, or All)
            limit: Maximum number of companies to return

        Returns:
            List of CompanyMatch objects sorted by confidence score
        """
        queries = self._build_queries(city_filter)
        all_results = []

        logger.info(f"Running {len(queries)} search queries...")

        for i, query in enumerate(queries, 1):
            logger.info(f"Query {i}/{len(queries)}: {query[:60]}...")

            try:
                results = self.search_client.search(query, num_results=20)
                all_results.extend(results)
            except Exception as e:
                logger.error(f"Search error for query '{query[:50]}': {e}")
                continue

        logger.info(f"Processing {len(all_results)} raw results...")

        # Deduplicate and score
        companies = {}

        for result in all_results:
            link = result.get("link", "")
            if not link:
                continue

            # Extract domain for deduplication
            domain = urlparse(link).netloc.replace("www.", "")

            # Skip job boards and aggregators (we want actual companies)
            job_board_domains = {
                "linkedin.com", "ca.linkedin.com", "indeed.com", "ca.indeed.com",
                "glassdoor.com", "glassdoor.ca", "ziprecruiter.com",
                "monster.com", "monster.ca", "careerbuilder.com",
                "simplyhired.com", "jobbank.gc.ca", "workopolis.com",
                "talent.com", "neuvoo.ca", "jooble.org", "adzuna.ca",
                "eluta.ca", "wowjobs.ca", "jobboom.com", "randstad.ca",
                "itjobs.ca", "expertini.com", "ca.expertini.com",
                "aijobs.net", "startup.jobs", "wellfound.com",
                "f6s.com", "crunchbase.com", "meetup.com",
                "wikipedia.org", "en.wikipedia.org",
                "youtube.com", "twitter.com", "facebook.com",
                "myjobscatalog.com", "ca.myjobscatalog.com",
            }

            if any(jb in domain for jb in job_board_domains):
                continue

            # Skip if we've seen this domain
            if domain in self._seen_domains:
                # But merge evidence sources
                if domain in companies:
                    companies[domain].evidence_sources.append(link)
                continue

            self._seen_domains.add(domain)

            # Score the result
            score, match_details = self.scorer.score_result(result)

            # Skip low-confidence matches
            if score < 15:
                continue

            # Extract information
            company_name = self._extract_company_name(result)
            city = self._detect_city(result)
            website, careers_url = self._extract_urls(result)

            # Apply city filter
            if city_filter == City.CALGARY and city != "Calgary":
                continue
            if city_filter == City.EDMONTON and city != "Edmonton":
                continue

            # Create company match
            company = CompanyMatch(
                company_name=company_name,
                city=city,
                industry_tags=self.scorer.extract_industry_tags(match_details),
                why_match=self.scorer.generate_why_match(match_details),
                likely_roles=self.scorer.extract_likely_roles(match_details),
                website=website,
                careers_url=careers_url,
                evidence_sources=[link],
                confidence_score=score,
                _keyword_matches=match_details,
            )

            companies[domain] = company

        # Sort by confidence score and limit
        sorted_companies = sorted(
            companies.values(),
            key=lambda c: c.confidence_score,
            reverse=True,
        )

        return sorted_companies[:limit]


# =============================================================================
# Output Exporters
# =============================================================================

class OutputExporter:
    """Export results to various formats."""

    @staticmethod
    def to_csv(companies: list[CompanyMatch], filepath: str):
        """Export companies to CSV file."""
        if not companies:
            logger.warning("No companies to export to CSV")
            return

        fieldnames = [
            "company_name", "city", "province", "industry_tags",
            "why_match", "likely_roles", "website", "careers_url",
            "evidence_sources", "confidence_score"
        ]

        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for company in companies:
                writer.writerow(company.to_dict())

        logger.info(f"Exported {len(companies)} companies to {filepath}")

    @staticmethod
    def to_json(companies: list[CompanyMatch], filepath: str):
        """Export companies to JSON file."""
        if not companies:
            logger.warning("No companies to export to JSON")
            return

        # Group by city
        grouped = {
            "Calgary": [],
            "Edmonton": [],
            "Other Alberta": [],
        }

        for company in companies:
            city_group = company.city if company.city in grouped else "Other Alberta"
            grouped[city_group].append(company.to_dict())

        output = {
            "generated_at": datetime.now().isoformat(),
            "total_companies": len(companies),
            "by_city": grouped,
            "all_companies": [c.to_dict() for c in companies],
        }

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        logger.info(f"Exported {len(companies)} companies to {filepath}")

    @staticmethod
    def print_summary(companies: list[CompanyMatch]):
        """Print a summary to console."""
        print("\n" + "=" * 70)
        print("ALBERTA COMPANY DISCOVERY RESULTS")
        print("=" * 70)

        # Group by city
        by_city = {}
        for c in companies:
            city = c.city if c.city in ["Calgary", "Edmonton"] else "Other Alberta"
            by_city.setdefault(city, []).append(c)

        for city in ["Calgary", "Edmonton", "Other Alberta"]:
            city_companies = by_city.get(city, [])
            if not city_companies:
                continue

            print(f"\n{city.upper()} ({len(city_companies)} companies)")
            print("-" * 40)

            for c in city_companies[:10]:  # Show top 10 per city
                print(f"  [{c.confidence_score:3d}] {c.company_name}")
                print(f"        {c.why_match[:60]}...")
                print(f"        Roles: {', '.join(c.likely_roles[:3]) or 'Various'}")
                print(f"        {c.website}")
                print()

        print("=" * 70)
        print(f"Total: {len(companies)} companies found")
        print("=" * 70)


# =============================================================================
# CLI Interface
# =============================================================================

def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Find Alberta companies matching your tech profile.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search all Alberta using DuckDuckGo (NO API KEY NEEDED!)
  python alberta_company_finder.py --api duckduckgo --city all --limit 40

  # Search Calgary only
  python alberta_company_finder.py --api duckduckgo --city calgary --limit 30

  # Use SerpAPI (requires key)
  python alberta_company_finder.py --api serpapi --limit 50

  # Use Google Custom Search (requires key)
  python alberta_company_finder.py --api google --limit 60

Environment Variables:
  GOOGLE_API_KEY          - Google Custom Search API key
  GOOGLE_SEARCH_ENGINE_ID - Google Custom Search Engine ID
  SERPAPI_KEY             - SerpAPI key (alternative to Google)
  (DuckDuckGo requires no API keys!)
        """,
    )

    parser.add_argument(
        "--city",
        type=str,
        choices=["calgary", "edmonton", "all"],
        default="all",
        help="City filter (default: all)",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=60,
        help="Maximum number of companies to return (default: 60)",
    )

    parser.add_argument(
        "--output",
        type=str,
        default="alberta_companies",
        help="Base filename for output (default: alberta_companies)",
    )

    parser.add_argument(
        "--api",
        type=str,
        choices=["google", "serpapi", "duckduckgo"],
        default="duckduckgo",
        help="Search API to use (default: duckduckgo - no API key needed!)",
    )

    parser.add_argument(
        "--cache-dir",
        type=str,
        default=".",
        help="Directory for cache database (default: current directory)",
    )

    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Disable caching (not recommended)",
    )

    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose logging",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be searched without making API calls",
    )

    return parser.parse_args()


def get_api_credentials(api_type: str) -> dict:
    """Get API credentials from environment variables."""
    if api_type == "google":
        api_key = os.environ.get("GOOGLE_API_KEY")
        search_engine_id = os.environ.get("GOOGLE_SEARCH_ENGINE_ID")

        if not api_key or not search_engine_id:
            logger.error(
                "Missing Google API credentials. Set GOOGLE_API_KEY and "
                "GOOGLE_SEARCH_ENGINE_ID environment variables."
            )
            sys.exit(1)

        return {"api_key": api_key, "search_engine_id": search_engine_id}

    elif api_type == "serpapi":
        api_key = os.environ.get("SERPAPI_KEY")

        if not api_key:
            logger.error(
                "Missing SerpAPI key. Set SERPAPI_KEY environment variable."
            )
            sys.exit(1)

        return {"api_key": api_key}

    elif api_type == "duckduckgo":
        # No API key needed for DuckDuckGo!
        return {}

    else:
        raise ValueError(f"Unknown API type: {api_type}")


def main():
    """Main entry point."""
    args = parse_args()

    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("Alberta Company Finder starting...")
    logger.info(f"City filter: {args.city}")
    logger.info(f"Result limit: {args.limit}")

    # Initialize components
    cache_path = Path(args.cache_dir) / ".alberta_company_cache.db"
    cache = CacheManager(str(cache_path))
    rate_limiter = RateLimiter(calls_per_second=1.0)

    # Clean expired cache entries
    cache.clear_expired()

    # Initialize profile and search configs
    profile = ProfileConfig()
    search_config = SearchConfig()

    # Dry run mode - just show queries
    if args.dry_run:
        logger.info("DRY RUN MODE - showing queries that would be executed:")
        scorer = CompanyScorer(profile)
        # Create a dummy client for query building
        engine = CompanyDiscoveryEngine(None, scorer, search_config)
        queries = engine._build_queries(City(args.city))
        for i, q in enumerate(queries, 1):
            print(f"  {i}. {q}")
        print(f"\nTotal: {len(queries)} queries")
        return

    # Get API credentials
    credentials = get_api_credentials(args.api)

    # Initialize search client
    if args.api == "google":
        search_client = GoogleCustomSearchClient(
            api_key=credentials["api_key"],
            search_engine_id=credentials["search_engine_id"],
            cache=cache,
            rate_limiter=rate_limiter,
        )
    elif args.api == "serpapi":
        search_client = SerpAPIClient(
            api_key=credentials["api_key"],
            cache=cache,
            rate_limiter=rate_limiter,
        )
    else:  # duckduckgo
        search_client = DuckDuckGoClient(
            cache=cache,
            rate_limiter=rate_limiter,
        )

    # Initialize scorer and discovery engine
    scorer = CompanyScorer(profile)
    engine = CompanyDiscoveryEngine(search_client, scorer, search_config)

    # Run discovery
    logger.info("Starting company discovery...")
    companies = engine.discover_companies(
        city_filter=City(args.city),
        limit=args.limit,
    )

    if not companies:
        logger.warning("No companies found matching criteria")
        return

    logger.info(f"Found {len(companies)} matching companies")

    # Export results
    csv_path = f"{args.output}.csv"
    json_path = f"{args.output}.json"

    OutputExporter.to_csv(companies, csv_path)
    OutputExporter.to_json(companies, json_path)
    OutputExporter.print_summary(companies)

    logger.info("Done!")


if __name__ == "__main__":
    main()

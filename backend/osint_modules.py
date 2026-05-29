"""Mock OSINT extraction modules for demo purposes"""
import random
from typing import Dict, List, Any
from datetime import datetime, timedelta
import re
import phonenumbers
from config import settings


class EmailAnalyzer:
    """Analyze emails for breaches and associations"""

    def analyze(self, email: str) -> Dict[str, Any]:
        if not settings.mock_mode:
            # Real implementation would call breach databases
            pass

        # Mock response
        breaches = []
        if random.random() > 0.3:  # 70% chance of breaches
            breach_names = ["LinkedIn 2021", "Dropbox 2016", "Yahoo 2013", "Facebook 2019"]
            num_breaches = random.randint(1, 3)
            for _ in range(num_breaches):
                breaches.append({
                    "name": random.choice(breach_names),
                    "date": (datetime.now() - timedelta(days=random.randint(365, 3650))).isoformat()
                })

        return {
            "email": email,
            "breaches": breaches,
            "verified": True,
            "last_seen": datetime.now().isoformat()
        }


class PhoneLookup:
    """Look up phone number details and associated data"""

    def lookup(self, phone: str) -> Dict[str, Any]:
        try:
            parsed = phonenumbers.parse(phone, "US")
            country = phonenumbers.region_code_for_number(parsed)
        except:
            country = "US"

        carriers = ["Verizon", "AT&T", "T-Mobile", "Sprint", "Vodafone"]
        carrier = random.choice(carriers)

        attributes = {
            "carrier": carrier,
            "country": country,
            "type": random.choice(["mobile", "landline"]),
            "verified": True
        }

        # 40% chance of finding related email
        related_email = None
        if random.random() > 0.6:
            domain = random.choice(["gmail.com", "yahoo.com", "company.io", "outlook.com"])
            related_email = f"user{random.randint(1000, 9999)}@{domain}"

        return {
            "phone": phone,
            "attributes": attributes,
            "related_email": related_email,
            "confidence": 0.85
        }


class SocialFootprintScanner:
    """Scan for social media presence"""

    def scan(self, username: str) -> Dict[str, Any]:
        platforms = [
            {"name": "Instagram", "confidence": 0.9, "followers": random.randint(100, 50000)},
            {"name": "Twitter", "confidence": 0.85, "followers": random.randint(50, 10000)},
            {"name": "LinkedIn", "confidence": 0.95, "followers": random.randint(100, 5000)},
            {"name": "TikTok", "confidence": 0.7, "followers": random.randint(0, 100000)},
            {"name": "Facebook", "confidence": 0.8, "followers": random.randint(100, 10000)},
        ]

        # Filter to 2-4 platforms
        selected = random.sample(platforms, random.randint(2, 4))

        for platform in selected:
            platform["url"] = f"https://{platform['name'].lower()}.com/{username}"

        return {
            "username": username,
            "platforms": selected,
            "profiles_found": len(selected)
        }


class BreachDatabaseQuerier:
    """Query breach database archives"""

    def query(self, email: str) -> Dict[str, Any]:
        breach_sources = [
            "LinkedIn", "Yahoo", "Facebook", "Adobe", "Amazon",
            "Spotify", "Instagram", "Twitter", "Dropbox", "GitHub"
        ]

        records = []
        if random.random() > 0.4:
            num_records = random.randint(1, 3)
            for _ in range(num_records):
                records.append({
                    "email": email,
                    "source": random.choice(breach_sources),
                    "date": (datetime.now() - timedelta(days=random.randint(365, 3650))).isoformat(),
                    "password_hashed": "***" if random.random() > 0.5 else None,
                    "other_fields": random.choice(["phone", "address", "dob", None])
                })

        return {
            "email": email,
            "records": records,
            "total_breaches": len(records)
        }


class FacialRecognitionMatcher:
    """Match facial recognition across images"""

    def match(self, image_url: str) -> Dict[str, Any]:
        return {
            "image_url": image_url,
            "confidence": random.uniform(0.75, 0.99),
            "source": random.choice(["Instagram", "Facebook", "LinkedIn", "Twitter"]),
            "matches": random.randint(0, 5)
        }


class DomainWhoisAnalyzer:
    """Analyze domain WHOIS data"""

    def analyze(self, domain: str) -> Dict[str, Any]:
        return {
            "domain": domain,
            "registrar": random.choice(["GoDaddy", "Namecheap", "Google Domains", "Network Solutions"]),
            "registered_date": (datetime.now() - timedelta(days=random.randint(30, 3650))).isoformat(),
            "expires_date": (datetime.now() + timedelta(days=random.randint(30, 365))).isoformat(),
            "admin_email": f"admin@{domain}",
            "name_servers": [f"ns{i}.example.com" for i in range(1, 3)]
        }


class PublicRecordsCrawler:
    """Crawl public records databases"""

    def crawl(self, name: str, location: str = None) -> Dict[str, Any]:
        return {
            "name": name,
            "location": location or "Unknown",
            "records": [
                {
                    "type": random.choice(["property", "business", "court", "license"]),
                    "title": f"Record {random.randint(1000, 9999)}",
                    "date": (datetime.now() - timedelta(days=random.randint(30, 1825))).isoformat()
                }
                for _ in range(random.randint(1, 4))
            ]
        }


class EntityResolver:
    """Resolve entity relationships and compute confidence scores"""

    @staticmethod
    def resolve_person(data_points: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Cross-reference multiple data points to build a unified person profile.
        Compute confidence based on consistency of attributes.
        """
        names = [dp.get("name") for dp in data_points if dp.get("name")]
        locations = [dp.get("location") for dp in data_points if dp.get("location")]
        emails = [dp.get("email") for dp in data_points if dp.get("email")]

        # Simple confidence: more consistent data points = higher confidence
        consistency_score = len(set(locations)) / max(len(locations), 1) if locations else 0.5
        confidence = 0.5 + (consistency_score * 0.5)

        return {
            "primary_name": names[0] if names else "Unknown",
            "aliases": list(set(names[1:])) if len(names) > 1 else [],
            "locations": list(set(locations)),
            "emails": list(set(emails)),
            "confidence": min(confidence, 0.99)
        }

    @staticmethod
    def compute_edge_confidence(source_type: str, target_type: str, relationship: str) -> float:
        """Compute confidence score for an entity relationship"""
        high_confidence = [
            ("email", "person", "REGISTERED_TO"),
            ("phone", "person", "OWNED_BY"),
            ("social", "person", "ACCOUNT_OF"),
        ]

        medium_confidence = [
            ("email", "social", "LINKED_TO"),
            ("phone", "email", "ASSOCIATED_WITH"),
        ]

        if (source_type, target_type, relationship) in high_confidence:
            return 0.95
        elif (source_type, target_type, relationship) in medium_confidence:
            return 0.75
        else:
            return 0.5

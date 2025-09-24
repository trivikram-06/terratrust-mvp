from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import os
from urllib.parse import urlparse

load_dotenv()
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

app = Flask(__name__)
CORS(app)

# --------------------------
# Phase 2 helpers (scrape + APIs)
# --------------------------
def scrape_website(url):
    try:
        res = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(res.text, "html.parser")

        title = soup.title.string.strip() if soup.title and soup.title.string else ""
        desc_tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        description = desc_tag["content"].strip() if desc_tag and desc_tag.get("content") else ""

        headings = [h.get_text(strip=True) for h in soup.find_all(["h1", "h2"])]
        texts = [el.get_text(separator=" ", strip=True) for el in soup.find_all(["p", "li", "span"])]
        text_content = " ".join(texts)[:15000]

        keywords_list = [
            "sustainability", "esg", "environment", "carbon", "renewable",
            "responsible", "supply chain", "climate", "net zero", "scope 1", "scope 2", "sustainable"
        ]
        found_keywords = [k for k in keywords_list if k in text_content.lower()]

        report_links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.lower().endswith(".pdf") and "sustain" in href.lower():
                report_links.append(requests.compat.urljoin(url, href))

        return {
            "title": title,
            "description": description,
            "headings": headings,
            "text_content": text_content,
            "found_keywords": found_keywords,
            "reports": report_links
        }
    except Exception as e:
        return {"error": str(e)}

# --------------------------
# WebsiteCarbon integration
# --------------------------
def get_website_carbon_data(url):
    try:
        # Fetch page bytes
        res = requests.get(url, timeout=8)
        page_bytes = len(res.content)

        # Assume green hosting = 0 for now (could be manually updated)
        api_url = f"https://api.websitecarbon.com/data?bytes={page_bytes}&green=0"
        r = requests.get(api_url, timeout=8)
        data = r.json()

        return {
            "carbon_grams": data.get("gco2e", 0),
            "green": data.get("green", False)
        }
    except Exception as e:
        print("WebsiteCarbon API error:", e)
        return {"carbon_grams": 12.3, "green": False}

# --------------------------
# News API
# --------------------------
def get_news_data(company_name):
    """
    Fetch live news articles related to the company and classify sentiment
    based on environmental/ESG context.
    """
    try:
        if not NEWS_API_KEY:
            return {"articles": []}

        # Query for company + environmental keywords
        query = f"{company_name} (environment OR sustainability OR pollution OR fine OR controversy OR emission OR climate)"
        api_url = f"https://newsapi.org/v2/everything?q={requests.utils.quote(query)}&sortBy=publishedAt&pageSize=10&apiKey={NEWS_API_KEY}"
        
        res = requests.get(api_url, timeout=8)
        data = res.json()
        articles = data.get("articles", [])[:10]

        # Simple sentiment classification
        pos_keywords = ["award", "initiative", "committed", "pledge", "recycle", "renewable", "sustainable", "reduction", "achieve"]
        neg_keywords = ["fine", "lawsuit", "controversy", "pollute", "violation", "emission", "accident", "toxic"]

        cleaned = []
        for a in articles:
            title_text = (a.get("title") or "").lower()
            sentiment = "neutral"
            if any(k in title_text for k in pos_keywords):
                sentiment = "positive"
            elif any(k in title_text for k in neg_keywords):
                sentiment = "negative"
            
            cleaned.append({
                "title": a.get("title"),
                "url": a.get("url"),
                "date": a.get("publishedAt"),
                "sentiment": sentiment
            })

        return {"articles": cleaned}

    except Exception as e:
        print("News API error:", e)
        return {"articles": []}

# --------------------------
# Location risk
# --------------------------
RISKY_CITIES = ["Beijing", "Delhi", "Lagos", "Dhaka", "Miami", "New Orleans"]

def get_google_places_data(location):
    risky = False
    if location:
        risky = any(rc.lower() in location.lower() for rc in RISKY_CITIES)
    return {"location": location or "", "risky_city": risky}

# --------------------------
# Collect all raw data
# --------------------------
def collect_raw_data(url, company_name, location):
    return {
        "website": scrape_website(url),
        "carbon": get_website_carbon_data(url),
        "news": get_news_data(company_name),
        "places": get_google_places_data(location)
    }

# --------------------------
# Phase 3: Scoring & Report
# --------------------------
def calculate_terratrust_score(raw_data):
    score = 50
    positives = []
    negatives = []

    website = raw_data.get("website", {})
    carbon = raw_data.get("carbon", {})
    news_articles = raw_data.get("news", {}).get("articles", [])
    places = raw_data.get("places", {})

    title = (website.get("title") or "").strip()
    description = (website.get("description") or "").strip()
    text_for_keywords = (website.get("text_content") or "").lower()

    # Keywords
    if website.get("found_keywords"):
        kcount = len(website["found_keywords"])
        add = min(20, 5 * kcount)
        score += add
        positives.append(f"Mentions sustainability keywords: {', '.join(website['found_keywords'][:3])}")
    else:
        score -= 5
        negatives.append("No sustainability-related keywords found on site")

    if website.get("reports"):
        score += 10
        positives.append("Found sustainability / CSR report PDF(s)")
    if not title:
        score -= 5
        negatives.append("Missing site title")
    if not description:
        score -= 3
        negatives.append("Missing meta description")

    # Carbon checks
    try:
        cgrams = carbon.get("carbon_grams")
        if cgrams is not None:
            if cgrams < 20:
                score += 10
                positives.append("Low estimated site carbon per page load")
            elif cgrams < 100:
                score += 2
            else:
                score -= 10
                negatives.append("High estimated site carbon per page load")
    except Exception:
        pass

    if carbon.get("green"):
        score += 5
        positives.append("Hosting flagged as green / renewable")

    # News sentiment
    neg_keywords = ["fine", "lawsuit", "controversy", "pollute", "violation", "emission", "accident", "toxic"]
    pos_keywords = ["award", "initiative", "committed", "pledge", "recycle", "renewable", "sustainable", "reduction", "achieve"]

    neg_count = 0
    pos_count = 0
    for a in news_articles:
        title_text = (a.get("title") or "").lower()
        if any(k in title_text for k in neg_keywords):
            neg_count += 1
        if any(k in title_text for k in pos_keywords):
            pos_count += 1

    if neg_count:
        score -= min(20, 7 * neg_count)
        negatives.append(f"{neg_count} negative environmental news mentions")
    if pos_count:
        score += min(10, 5 * pos_count)
        positives.append(f"{pos_count} positive environmental news mentions")

    if places.get("risky_city"):
        score -= 10
        negatives.append(f"HQ / main location flagged as high climate risk: {places.get('location')}")
    else:
        score += 2

    score = max(0, min(100, int(score)))
    return score, positives, negatives

def generate_report_content(score, positives, negatives, raw_data):
    highlights = positives[:3] if positives else ["No clear sustainability highlights found"]
    risks = negatives[:3] if negatives else ["No major immediate red flags detected"]

    summary = f"TerraTrust Score: {score}/100."
    if score >= 75:
        summary += " Overall low climate & reputational risk detected based on available public data."
    elif score >= 45:
        summary += " Moderate risk — some sustainability signals but also gaps to investigate."
    else:
        summary += " High climate & reputational risk — proceed with caution and request detailed disclosures."

    return {"score": score, "highlights": highlights, "risks": risks, "summary": summary}

# --------------------------
# Routes
# --------------------------
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"})

@app.route("/analyze", methods=["POST"])
def analyze():
    payload = request.get_json() or {}
    url = payload.get("url", "").strip()
    hostname = ""
    try:
        hostname = urlparse(url).hostname or ""
    except Exception:
        hostname = url

    inferred_name = hostname.replace("www.", "").split(".")[0].replace("-", " ").title() if hostname else "TargetCompany"

    company_name = payload.get("company_name") or inferred_name
    location = payload.get("location") or payload.get("hq") or "San Francisco"

    raw = collect_raw_data(url, company_name, location)
    score, positives, negatives = calculate_terratrust_score(raw)
    report = generate_report_content(score, positives, negatives, raw)

    return jsonify({
        "score": report["score"],
        "highlights": report["highlights"],
        "risks": report["risks"],
        "summary": report["summary"],
        "raw": raw
    })

if __name__ == "__main__":
    app.run(debug=True)

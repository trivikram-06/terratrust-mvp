import requests
from bs4 import BeautifulSoup

def scrape_website(url):
    # Simplified scraping
    res = requests.get(url, timeout=8)
    soup = BeautifulSoup(res.text, "html.parser")
    title = soup.title.string if soup.title else ""
    description = soup.find("meta", attrs={"name":"description"})
    description = description["content"] if description else ""
    text_content = " ".join([p.get_text() for p in soup.find_all("p")])
    
    keywords = ["sustainability","esg","carbon","renewable","climate"]
    found_keywords = [k for k in keywords if k in text_content.lower()]
    
    return {
        "title": title,
        "description": description,
        "found_keywords": found_keywords
    }

def get_website_carbon(url):
    # Mock example
    return {"carbon_grams": 12.3, "green": False}

def get_news_score(company_name):
    # Mock example
    return {"positive": 1, "negative":0}

def get_location_score(location="San Francisco"):
    risky_cities = ["Beijing","Delhi","Lagos"]
    return {"risky": location in risky_cities}

def calculate_category_scores(raw):
    carbon_score = 0
    if raw["carbon"]["carbon_grams"] < 20:
        carbon_score = 25
    elif raw["carbon"]["carbon_grams"] < 100:
        carbon_score = 10
    else:
        carbon_score = -10

    reputation_score = raw["news"]["positive"]*5 - raw["news"]["negative"]*5
    location_score = -10 if raw["location"]["risky"] else 10
    policy_score = 10 if raw["website"]["found_keywords"] else -5

    total = max(0, carbon_score + reputation_score + location_score + policy_score + 50)
    return {
        "total": total,
        "carbon": carbon_score,
        "reputation": reputation_score,
        "location": location_score,
        "policy": policy_score
    }

import requests
import datetime
import json
import os
from dateutil import parser

# Constants
DESK_ID = "b9bfa0df-9ef2-4e9f-813e-fd74302743a4"
API_KEY = "manage_vdVf3KsisgkLCBJ2wpBP5"
ACCOUNT_SLUG = "smart-compass"
BASE_URL = "https://api.moveo.ai/api/v1"

def fetch_conversations():
    url = f"{BASE_URL}/desks/{DESK_ID}/conversations"
    headers = {
        "Authorization": f"apikey {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Calculate date range
    end_date = datetime.datetime.now(datetime.timezone.utc)
    start_date = end_date - datetime.timedelta(days=90)
    
    print(f"Fetching conversations from {start_date} to {end_date}")
    
    conversations = []
    next_cursor = None
    has_more = True
    
    while has_more:
        params = {
            "account_slug": ACCOUNT_SLUG,
            "limit": 50  # Max limit usually
        }
        if next_cursor:
            params["next_cursor"] = next_cursor
            
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Check structure based on typical API responses, might need adjustment
            # Assuming 'results' or 'data' contains the list
            page_conversations = data.get("conversations", [])
            if not page_conversations and isinstance(data, list):
                page_conversations = data
            
            if not page_conversations:
                print("No more conversations found.")
                break
                
            print(f"Fetched {len(page_conversations)} conversations in this page.")
            
            for conv in page_conversations:
                # Try to find the creation timestamp
                created_at_str = conv.get("created_time") or conv.get("created_at") or conv.get("inserted_at") or conv.get("created")
                
                if not created_at_str:
                    print("Warning: Could not find creation time in conversation object. Keys:", conv.keys())
                    # If we can't determine time, we might have to include it or skip.
                    # Let's include it for now to be safe, or break if we assume strict ordering.
                    conversations.append(conv)
                    continue
                
                try:
                    created_at = parser.parse(created_at_str)
                    # Ensure timezone awareness
                    if created_at.tzinfo is None:
                        created_at = created_at.replace(tzinfo=datetime.timezone.utc)
                    
                    if created_at < start_date:
                        # Assuming the API returns newest first (standard), we can stop here
                        print(f"Reached conversation from {created_at}, which is older than {start_date}. Stopping.")
                        has_more = False
                        break
                    
                    if created_at <= end_date:
                        conversations.append(conv)
                        
                except Exception as e:
                    print(f"Error parsing date {created_at_str}: {e}")
                    conversations.append(conv) # Keep if unsure
            
            # Pagination logic
            pagination = data.get("pagination", {})
            next_cursor = pagination.get("next_cursor")
            if not next_cursor:
                has_more = False
                
        except requests.exceptions.RequestException as e:
            print(f"API Request Failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response Body: {e.response.text}")
            break
    
    print(f"Total conversations found from last 3 months: {len(conversations)}")
    
    # Analysis
    stats = {
        "with_response": 0,
        "more_than_3": 0,
        "more_than_5": 0,
        "more_than_7": 0,
        "more_than_10": 0
    }
    tag_stats = {}
    
    # Funnel Analysis
    funnel_tags = ["nao_conheco", "sou_eu", "bloquear"]
    funnel_stats = {tag: {"count": 0, "total_erv": 0.0} for tag in funnel_tags}
    
    # Interaction ERV Analysis
    interaction_buckets = {
        "more_than_3": {"count": 0, "total_erv": 0.0},
        "more_than_5": {"count": 0, "total_erv": 0.0},
        "more_than_7": {"count": 0, "total_erv": 0.0},
        "more_than_10": {"count": 0, "total_erv": 0.0}
    }
    
    for conv in conversations:
        msg_count = conv.get("message_count", 0)
        
        # Extract ERV for this conversation
        context = conv.get("context", {})
        live_instructions = context.get("live_instructions", {})
        erv_str = live_instructions.get("ERV", "0")
        erv_val = 0.0
        try:
            # Clean ERV string: remove 'R$', dots, replace comma with dot
            erv_clean = erv_str.replace("R$", "").replace(".", "").replace(",", ".").strip()
            erv_val = float(erv_clean)
        except ValueError:
            pass # Ignore if ERV is not a valid number
        
        if msg_count > 1:
            stats["with_response"] += 1
        if msg_count > 3:
            stats["more_than_3"] += 1
            interaction_buckets["more_than_3"]["count"] += 1
            interaction_buckets["more_than_3"]["total_erv"] += erv_val
        if msg_count > 5:
            stats["more_than_5"] += 1
            interaction_buckets["more_than_5"]["count"] += 1
            interaction_buckets["more_than_5"]["total_erv"] += erv_val
        if msg_count > 7:
            stats["more_than_7"] += 1
            interaction_buckets["more_than_7"]["count"] += 1
            interaction_buckets["more_than_7"]["total_erv"] += erv_val
        if msg_count > 10:
            stats["more_than_10"] += 1
            interaction_buckets["more_than_10"]["count"] += 1
            interaction_buckets["more_than_10"]["total_erv"] += erv_val
            
        # Tag analysis
        if context:
            tags = context.get("tags", [])
            for tag in tags:
                tag_stats[tag] = tag_stats.get(tag, 0) + 1
                
                # Funnel & ERV Analysis (Tag based)
                if tag in funnel_tags:
                    funnel_stats[tag]["count"] += 1
                    funnel_stats[tag]["total_erv"] += erv_val
    
    total = len(conversations)
    print("\n--- Statistics ---")
    print(f"Total conversations: {total}")
    if total > 0:
        print(f"With response (>1 message): {stats['with_response']} ({stats['with_response']/total*100:.2f}%)")
        print(f"More than 3 interactions: {stats['more_than_3']} ({stats['more_than_3']/total*100:.2f}%)")
        print(f"More than 5 interactions: {stats['more_than_5']} ({stats['more_than_5']/total*100:.2f}%)")
        print(f"More than 7 interactions: {stats['more_than_7']} ({stats['more_than_7']/total*100:.2f}%)")
        print(f"More than 10 interactions: {stats['more_than_10']} ({stats['more_than_10']/total*100:.2f}%)")
        
        print("\n--- Interaction ERV Analysis ---")
        for bucket_name in ["more_than_3", "more_than_5", "more_than_7", "more_than_10"]:
            data = interaction_buckets[bucket_name]
            count = data["count"]
            total_erv = data["total_erv"]
            avg_erv = total_erv / count if count > 0 else 0.0
            label = bucket_name.replace("_", " ").title()
            print(f"{label}:")
            print(f"  Volume: {count}")
            print(f"  Total ERV: R$ {total_erv:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
            print(f"  Avg ERV: R$ {avg_erv:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        
        print("\n--- Funnel & ERV Analysis (Tags) ---")
        for tag in funnel_tags:
            data = funnel_stats[tag]
            count = data["count"]
            total_erv = data["total_erv"]
            avg_erv = total_erv / count if count > 0 else 0.0
            print(f"Tag: {tag}")
            print(f"  Volume: {count}")
            print(f"  Total ERV: R$ {total_erv:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
            print(f"  Avg ERV: R$ {avg_erv:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        
        print("\n--- Tag Volume ---")
        if tag_stats:
            sorted_tags = sorted(tag_stats.items(), key=lambda item: item[1], reverse=True)
            for tag, count in sorted_tags:
                print(f"{tag}: {count} ({count/total*100:.2f}%)")
        else:
            print("No tags found.")
    else:
        print("No conversations found to analyze.")
    print("------------------\n")
    
    # Save to file
    output_file = "conversations_last_3_months.json"
    with open(output_file, "w") as f:
        json.dump(conversations, f, indent=2)
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    fetch_conversations()

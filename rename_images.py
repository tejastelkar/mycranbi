import os
import base64
import requests
import time
from io import BytesIO
from PIL import Image

API_KEY = os.environ.get("GROQ_API_KEY", "your_api_key_here")
DIR_PATH = "My cranbi final jpeg"
MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

def resize_and_encode_image(image_path, max_size=(1024, 1024)):
    try:
        with Image.open(image_path) as img:
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            img.thumbnail(max_size)
            buffered = BytesIO()
            img.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return f"data:image/jpeg;base64,{img_str}"
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

def get_new_name(base64_image):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract the exact product name from the image, including the brand name 'mycranbi' or 'cranbi' if visible. Return ONLY the product name (e.g. 'mycranbi_orange_soap_bar') and use underscores instead of spaces. Do not include any punctuation, quotes, or extra text."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": base64_image
                        }
                    }
                ]
            }
        ],
        "temperature": 0.1,
        "max_tokens": 20
    }
    
    while True:
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        if response.status_code == 200:
            data = response.json()
            desc = data['choices'][0]['message']['content'].strip()
            
            valid_chars = "-_. abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
            safe_desc = ''.join(c for c in desc if c in valid_chars)
            safe_desc = safe_desc.replace(" ", "_").lower()
            if not safe_desc:
                return None
            return safe_desc
        elif response.status_code == 429:
            print("Rate limit hit, sleeping for 5 seconds...")
            time.sleep(5)
        else:
            print(f"API Error: {response.status_code} - {response.text}")
            return None

def main():
    files = [f for f in os.listdir(DIR_PATH) if f.lower().endswith('.jpg') and not f.startswith('.')]
    print(f"Found {len(files)} images to process.")
    
    for idx, filename in enumerate(files):
        print(f"Processing {idx+1}/{len(files)}: {filename}")
        filepath = os.path.join(DIR_PATH, filename)
        
        base64_img = resize_and_encode_image(filepath)
        if not base64_img:
            continue
            
        new_name_base = get_new_name(base64_img)
        if new_name_base:
            if 'cranbi' not in new_name_base:
                new_name_base = f"mycranbi_{new_name_base}"
                
            new_filename = f"{new_name_base}.jpg"
            new_filepath = os.path.join(DIR_PATH, new_filename)
            
            if new_filepath == filepath:
                print(f"Name already matches: {new_filename}")
                continue
                
            counter = 1
            while os.path.exists(new_filepath):
                new_filename = f"{new_name_base}_{counter}.jpg"
                new_filepath = os.path.join(DIR_PATH, new_filename)
                counter += 1
                
            os.rename(filepath, new_filepath)
            print(f"Renamed {filename} to: {new_filename}")
        else:
            print(f"Failed to get new name for {filename}")
            
        time.sleep(0.5)

if __name__ == '__main__':
    main()

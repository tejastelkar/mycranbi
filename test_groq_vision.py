import os
import base64
import requests

api_key = os.environ.get("GROQ_API_KEY", "your_api_key_here")

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

image_path = "my cranbi final jpeg/agarbatti 1.jpg"
base64_image = encode_image(image_path)

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

payload = {
    "model": "llama-3.2-11b-vision-preview",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What's in this image? Describe it in 2-4 words."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                }
            ]
        }
    ],
    "max_tokens": 10
}

response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
print(response.json())

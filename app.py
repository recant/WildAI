from openai import OpenAI
import base64

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="not-needed"
)

# Encode your image
with open("test.png", "rb") as f:
    image_data = base64.b64encode(f.read()).decode("utf-8")

response = client.chat.completions.create(
    model="lfm25-vl-450m",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{image_data}"}
                },
                {
                    "type": "text",
                    "text": "What camping gear do you see in the image? How should I set up camp with these items?"
                }
            ]
        }
    ],
    temperature=0.1,
    max_tokens=512,
    extra_body={"top_k": 50, "repetition_penalty": 1.05},
)

print(response.choices[0].message.content)
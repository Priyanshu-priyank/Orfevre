import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use gemini-1.5-flash — fast, cheap, widely available
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.3,
    )
)


async def call_gemini(prompt: str) -> dict:
    """
    Call Gemini and parse the JSON response.
    Falls back to error dict instead of crashing the entire request.
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown fences if Gemini adds them despite JSON mode
        if text.startswith("```"):
            parts = text.split("```")
            text = parts[1] if len(parts) > 1 else parts[0]
            if text.startswith("json"):
                text = text[4:]

        return json.loads(text.strip())

    except json.JSONDecodeError as e:
        return {"error": f"Gemini returned invalid JSON: {str(e)}", "raw": text}
    except Exception as e:
        return {"error": str(e)}
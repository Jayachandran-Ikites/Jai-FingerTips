import os
import json
import logging
import time
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv      
import openai

# ─── Load .env ────────────────────────────────────────────────────────────────

load_dotenv()  # now os.getenv will see values from your .env file

# ─── Configuration & Initialization ─────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)

API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY:
    raise RuntimeError("Please set the OPENAI_API_KEY environment variable (in your .env or shell)")

client = openai.OpenAI(api_key=API_KEY)

PATHWAY_MODEL = os.getenv("PATHWAY_MODEL", "gpt-4.1-mini-2025-04-14")
SUMMARIZATION_MODEL = os.getenv("SUMMARIZATION_MODEL", "o4-mini-2025-04-16")

# ─── Utility Functions ─────────────────────────────────────────────────────────

def call_model(
    model: str,
    messages: List[dict],
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    **kwargs
) -> str:
    """
    Call OpenAI ChatCompletion with a simple retry loop on rate limits.
    Uses temperature ONLY if not summarization model.
    """
    for attempt in range(1, max_retries + 1):
        try:
            call_args = {
                "model": model,
                "messages": messages,
                **kwargs
            }
            # Only use temperature if model is not summarization model
            if model != SUMMARIZATION_MODEL:
                call_args["temperature"] = kwargs.get("temperature", 0.2)
            resp = client.chat.completions.create(**call_args)
            return resp.choices[0].message.content

        except openai.RateLimitError:
            if attempt == max_retries:
                logging.error("Rate limit reached; no more retries left.")
                raise
            wait_time = backoff_factor ** (attempt - 1)
            logging.warning(
                f"Rate limited. Retrying in {wait_time:.1f}s "
                f"(attempt {attempt}/{max_retries})"
            )
            time.sleep(wait_time)
        except Exception:
            logging.exception("OpenAI API call failed unexpectedly:")
            raise


# ─── Title Generation Helper ───────────────────────────────────────────────────
def generate_conversation_title(first_message: str) -> str:
    prompt = (
        "You’re a smart assistant. Given the first user message below, come up with a concise, human-readable chat title "
        "(no more than 5 words):\n\n"
        f"“{first_message}”"
    )
    title = call_model(
        PATHWAY_MODEL,
        [{"role": "user", "content": prompt}],
        temperature=0.0
    ).strip().strip('"')
    return title or "New Chat"

# --- Summary of all content ───────────────────────────────────────────────────
def summarize_conversation(history: List[Dict[str, str]]) -> Dict[str, Optional[str]]:
    # Prompt template for summarizing the entire conversation
    summary_prompt = f"""
       Please summarize the entire conversation as a single, 
       concise narrative paragraph that a busy doctor can quickly scan to 
       understand what happened. Focus on the patient scenario, 
       including age, key symptoms, relevant findings and vitals, 
       your diagnostic classification using low-resource criteria, 
       and the treatment plan (drug choice and dosing, supportive 
       measures, patient counseling). Clearly state thresholds for 
       referral or escalation, and the role of community health 
       workers in follow-up or home monitoring. Do not use bullet
       points, headings, or mention platform or AI guidance; 
       write only a clear, clinically focused case summary in past tense.
    """

    messages = [{"role": "system", "content": summary_prompt}] + history

    summary = call_model(PATHWAY_MODEL, messages)
    return {
        "summary" : summary
    }
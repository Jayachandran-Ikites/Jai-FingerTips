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
SUMMARIZATION_MODEL = os.getenv("SUMMARIZATION_MODEL", "gpt-4.1-2025-04-14")

# ─── Utility Functions ─────────────────────────────────────────────────────────

def load_markdowns(folder: str) -> List[Tuple[str, str]]:
    """
    Read all .md files from `folder` and return a list of (content, filename) tuples.
    The `folder` is interpreted relative to this script’s directory if not absolute.
    """
    base_dir = Path(__file__).resolve().parent
    md_path = Path(folder)
    if not md_path.is_absolute():
        md_path = base_dir / folder

    if not md_path.exists() or not md_path.is_dir():
        # for debugging, show where we looked
        logging.error("Tried to load markdowns from %s (cwd=%s)", md_path, Path.cwd())
        raise FileNotFoundError(f"Folder not found: {md_path}")

    return [(p.read_text(encoding="utf-8"), p.name) for p in md_path.glob("*.md")]

def call_model(
    model: str,
    messages: List[dict],
    temperature: float = 0.2,
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    **kwargs
) -> str:
    """
    Call OpenAI ChatCompletion with a simple retry loop on rate limits.
    """
    for attempt in range(1, max_retries + 1):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                **kwargs
            )
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

def parse_json_response(raw: str) -> Dict[str, Optional[str]]:
    """Safely parse a JSON blob from the model response."""
    try:
        data = json.loads(raw)
        return {
            "answer": data.get("answer"),
            "context": data.get("context"),
            "disease":data.get("disease"),
            "source": data.get("source")

        }
    except json.JSONDecodeError:
        logging.error("Failed to parse JSON from model response: %r", raw)
        return {"answer": None, "context": None, "disease":None,"source": None}

def get_relevant_info(query: str, markdown: str, disease_name: str) -> Dict[str, Optional[str]]:
    """Extract answer/context/source from a single disease markdown."""
    # print("disease_name:",disease_name)
    system_prompt = (
        f"You are a medical assistant. "
        f"Given a user query and a disease markdown, first determine if that markdown contains information that directly answers the query. "
        f"You can get answer from image , lines and tables. So check everything properly"
        f"• If it does NOT, respond with {{\"answer\": null, \"context\": null, \"disease\": null, \"source\": null}}. "
        f"• If it DOES, extract the following four things:\n"
        f"  1) \"answer\": the minimal excerpt that directly answers the query,\n"
        f"  2) \"context\": one or two sentences of surrounding text for additional context,\n"
        f"  3) \"disease\": \"{disease_name.replace('.md', '')}\",\n"
        f"  4) \"source\": a JSON object with two keys:\n"
        f"     - \"lines\": a list of line numbers and image numbers used in the answer, e.g. [\"L34\", \"L35\",\"I1\"],\n"
        f"     - \"tables\": a dictionary where each key is the table identifier (e.g. \"T1\", \"T2\") and each value is a list of used cell coordinates in that table, e.g. {{\"T1\": [\"R1C1\", \"R2C2\"]}}.\n"
        f"If no tables or lines  are used in the answer, then do not return that field .\n"
        f"Always return valid JSON with exactly these keys: \"answer\", \"context\", \"disease\" and \"source\". The value of \"source\" must itself be a JSON object with \"lines\" (list) and \"tables\" (dictionary)."
    )

    # print(system_prompt)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"User Query: {query}\n\nDisease Markdown:\n{markdown}"}
    ]
    raw = call_model(PATHWAY_MODEL, messages)
    raw=parse_json_response(raw)
    # print("raw",raw)
    return raw

# ─── Combined History Check & Query Refinement ─────────────────────────────────
def get_history_insights(query: str, history: List[Dict[str, str]]) -> Dict[str, Optional[str]]:
    """
    Returns a JSON with two keys:
    - answer: a direct answer from history if present, else null
    - refined_query: a clarified version of the question incorporating context from history if no direct answer, else null
    Always outputs valid JSON.
    If the user's question cannot be confidently answered from history (e.g., because context shifted), return answer:null and provide refined_query for new context.
    """
    system_prompt = (
        "You are a medical assistant reviewing a conversation. "
        "Given the user's query and the chat history, choose exactly one of the following actions:\n"
        "1) If the question was already explicitly answered in history, return JSON {\"answer\": exact answer text, \"refined_query\": null}.\n"
        "2) Otherwise (including when context has shifted), return JSON {\"answer\": null, \"refined_query\": clarified question that incorporates any relevant entities or context needed to search fresh source documents}.\n"
        "Always output valid JSON with exactly these two keys and no additional text."
    )
    messages = [{"role": "system", "content": system_prompt}] + history + [
        {"role": "user", "content": f"User Query: {query}"}
    ]
    raw = call_model(PATHWAY_MODEL, messages)
    return parse_json_response(raw)


# ─── Title Generation Helper ───────────────────────────────────────────────────
def generate_conversation_title(first_message: str) -> str:
    prompt = (
        "You’re a smart assistant. Given the first user message below, come up with a concise, human-readable chat title "
        "(no more than 5 words):\n\n"
        f"“{first_message}”"
    )
    title = call_model(
        SUMMARIZATION_MODEL,
        [{"role": "user", "content": prompt}],
        temperature=0.0
    ).strip().strip('"')
    return title or "New Chat"

# ─── Main Function ───────────────────────────────────────────────────

def answer_medical_query(query: str, history: List[Dict[str, str]], markdown_folder: str = "./disease_markdown") -> str:
    """Load markdowns, extract relevant info, and synthesize a final answer."""
    if history:
        insights = get_history_insights(query, history)
        if insights.get("answer"):
            return insights["answer"]
        refined = insights.get("refined_query") or query
    else:
        refined = query

    logging.info("Using query: %s", refined)

    # 2. Search markdowns
    docs = load_markdowns(markdown_folder)
    logging.info("Loaded %d markdown files.", len(docs))
    with ThreadPoolExecutor(max_workers=min(11, len(docs))) as executor:
        results = list(executor.map(lambda md: get_relevant_info(refined, md[0],md[1]), docs))

    filtered = [r for r in results if r.get("answer")!=None]
    # print("Filtered:",results)
    if not filtered:
        return "I’m sorry, I couldn’t find any information relevant to your question."

    combined = "\n\n".join(
        f"- Disease ({item['disease']})\n  Answer: {item['answer']}\n  Context: {item['context']}"
        for item in filtered
    )
    sources = {
        item["disease"]: item["source"]
        for item in filtered
    }

    # print("sources1:",sources)
    synth_system = (
        "You are an Indian doctor working in a resource-constrained environment and an expert medical summarizer. Follow these steps:\n"
        "1. If the user’s question is already answered in our conversation, respond immediately using that content.\n"
        "2. Identify the key concepts in the question.\n"
        "3. For each provided JSON object where “answer” is non-null and clearly relevant:\n"
        "   • Integrate its “answer” and, if needed, its “context,” grouping related points under logical sub-headings.\n"
        "   • Insert an inline citation in parentheses after each fact, e.g. “(Pathway X)”.\n"
        "4. Discard any JSON objects whose “answer” or “context” aren’t directly helpful.\n"
        "5. Begin your reply with a succinct overview statement (avoiding “Here’s a summary”).\n"
        "6. Present detailed sections under clear markdown headings (e.g., “### Symptom Overview”, “### Treatment Guidelines”).\n"
        "7. Use blank lines between paragraphs for readability, and ensure proper markdown formatting throughout.\n"
        "8. If no objects are relevant, reply exactly: \"I’m sorry, I couldn’t find any information relevant to your question.\".\n"
    )

    


    messages = []

    messages.append({"role": "system", "content": synth_system})

    # Include past turns
    for turn in history:
        messages.append({
            "role": turn["role"],
            "content": turn["content"]
        })

    messages.append({"role": "user", "content": f"User Query: {query}\n\nCollected facts:\n{combined}"})
    # messages.append({"role": "assistant", "content": f"User Query: {query}\n\nCollected facts:\n{combined}"})

    final = call_model(SUMMARIZATION_MODEL, messages)
    final_answer={}
    final_answer["answer"]=final
    final_answer["sources"]=sources
    if isinstance(final_answer, str):
        data = json.loads(final_answer)
    else:
        data = final_answer  
    # print("data:",data)
    return data

# ─── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Answer a medical question from disease markdowns."
    )
    parser.add_argument("query", help="The medical question to answer")
    parser.add_argument(
        "--folder",
        default="disease_markdown",
        help="Path to the folder containing .md files"
    )
    parser.add_argument(
        "--history",
        nargs="*",
        default=[],
        help="Optional previous questions or conversation history"
    )

    args = parser.parse_args()
    reply=answer_medical_query(args.query, args.history,args.folder)
    print(reply)
    # print(type(sources))
    

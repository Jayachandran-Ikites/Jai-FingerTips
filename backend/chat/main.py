import os
import json
import logging
import time
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from .utils import call_model
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

# ─── Get Relevant Part from Pathway ─────────────────────────────────────────────────────────

def get_relevant_info(query: str, markdown: str, disease_name: str) -> Dict[str, Optional[str]]:
    """Extract answer/context/source from a single disease markdown."""

    system_prompt = (
    f"You are a medical assistant designed to extract only clinically relevant, traceable information from a markdown file about a single disease: {disease_name.replace('.md', '')}."
    f"\n\nThe markdown contains only these three block types:"
    f"\n- Numbered lines (e.g., #L23) for plain text."
    f"\n- Numbered image blocks (e.g., #I1), which are actually text summaries of figures or charts."
    f"\n- Numbered tables (e.g., #T1) for tabular data."
    f"\n\nFollow these instructions for each user query:"
    f"\n\n1. **Disease-level relevance filter:**"
    f"\n   - Before extracting anything, decide if the user's query is plausibly asking about the disease in this markdown."
    f"\n   - Only proceed if:"
    f"\n        • The user asks about this disease by name, OR"
    f"\n        • The user's question or case description strongly suggests this disease is being considered, OR"
    f"\n        • The user's symptoms, signs, or context make this disease a likely differential diagnosis *and* the user is seeking information relevant to it."
    f"\n   - If this disease is NOT relevant to the user's query (e.g., their symptoms or concern are unrelated), reply with exactly:"
    f"\n     {{\"answer\": null, \"context\": null, \"disease\": null, \"source\": {{\"lines\": [], \"images\": [], \"tables\": {{}}}}, \"source_notes\": null}}"
    f"\n   - Do NOT extract or summarize anything from this markdown if the disease is not relevant—even if some blocks mention related symptoms or treatments."
    f"\n\n2. **If the disease is relevant, extract information as follows:**"
    f"\n   - \"answer\": The minimal excerpt(s) from the markdown that directly and specifically answer the user's query. If constructing from multiple blocks, combine concisely."
    f'\n   - "context": Include all relevant supporting information, background, reasoning, guidelines, adaptations, red flags, and clinical caveats from the markdown that could help a downstream large language model generate the best, most accurate and nuanced clinical answer possible. This includes (but is not limited to): detailed management steps, alternative diagnoses, risk stratification, patient-specific considerations, local resource adaptations, important statistics, referral or escalation criteria, warnings, and common pitfalls. You may summarize, synthesize, or selectively quote from multiple blocks as needed. Be exhaustive—include anything you judge relevant to helping the LLM provide excellent clinical guidance, but avoid irrelevant or repeated data.'
    f"\n   - \"disease\": \"{disease_name.replace('.md', '')}\""
    f"\n   - \"source\":"
    f"\n       - \"lines\": A complete list of ALL line numbers (e.g., [\"L61\", \"L62\"]) whose content contributed to answer or context."
    f"\n       - \"images\": A complete list of ALL image block numbers (e.g., [\"I1\"]) used for answer or context."
    f"\n       - \"tables\": A complete dictionary of ALL table IDs and their referenced cell coordinates (e.g., {{\"T1\": [\"R2C2\"]}}) used for answer or context."
    f"\n   - \"source_notes\": A brief explanation describing why EVERY listed line, image, or table was included, and what part of the answer or context it supports."
    f"\n\n3. **Be exhaustive with sources:**"
    f"\n   - If an answer or context uses even a phrase or value from a block, that block’s ID must appear in sources."
    f"\n   - If multiple blocks are used, all must be referenced in 'source', with no omissions."
    f"\n\n4. **Format strictly:**"
    f"\n   - Always return valid JSON with exactly these five keys: \"answer\", \"context\", \"disease\", \"source\", and \"source_notes\"."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"User Query: {query}\n\nDisease Markdown:\n{markdown}"}
    ]
    raw = call_model(PATHWAY_MODEL, messages)
    raw = parse_json_response(raw)

    # print("raw",raw)
    return raw

# ─── Disease Classifier ─────────────────────────────────────────────────────────

def classify_query_to_diseases(query: str, diseases: List[str]) -> List[str]:
    system_prompt = f"""
You are a clinical triage assistant for a rural Indian clinic. For each clinical query, decide which diseases from the list below are clinically relevant—either clearly indicated, strongly suggested, or reasonably possible (“borderline”). Ignore diseases that are only weakly possible or would not usually be considered in this scenario.

Diseases to consider:
- anaemia
- asthma
- copd
- diabetic_foot_ulcer
- diarrhoea
- fever
- heart_failure
- pneumonia
- stroke
- chestpain

Instructions:
- A disease is “relevant” if: the query’s symptoms, findings, or explicit question make it a likely diagnosis, a strong differential, or a reasonable possibility given the context—even if not classic.
- Do NOT include diseases that are only marginally or theoretically possible; select only those with a real clinical reason for consideration in this case.
- Ignore any diseases where there is no direct or plausible link from the case or query.
- When listing relevant diseases, use exactly these forms: anaemia, asthma, copd, diabetic_foot_ulcer, diarrhoea, fever, heart_failure, pneumonia, stroke, chestpain
- Return only the relevant diseases from the above list, as an array in JSON format, with the key "disease".
- If none are relevant, return: {{ "disease": [] }}
- Do not explain or add any extra text.

Examples:

Query: "44F with 2 days of frequent loose stools, crampy abdominal pain, intermittent central chest discomfort. No fever or vomiting. HR 115, BP 100/70, RR 22, SpO2 96. Need low-cost diagnostic approach for chest pain differential and management plan for both."
Relevant diseases: {{ "disease": ["diarrhoea", "chestpain", "heart_failure"] }}

Query: "Teen with cough, wheeze, increased work of breathing; O2 sat 91%. No fever."
Relevant diseases: {{ "disease": ["asthma"] }}

Query: "Elderly man with swelling of both feet, shortness of breath on exertion, orthopnea. BP 130/90, HR 92, O2 sat 97%."
Relevant diseases: {{ "disease": ["heart_failure"] }}

Query: "Adult with fever, severe calf ulcer, and diabetes."
Relevant diseases: {{ "disease": ["fever", "diabetic_foot_ulcer"] }}

Query: "Male with severe headache, one-sided weakness, sudden onset."
Relevant diseases: {{ "disease": ["stroke"] }}

Query: "Adult with diarrhoea and vomiting, HR 110, BP 90/60."
Relevant diseases: {{ "disease": ["diarrhoea"] }}
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Query: {query}"}
    ]
    raw = call_model(PATHWAY_MODEL, messages)
    try:
        disease_json = json.loads(raw)
        if isinstance(disease_json, dict) and isinstance(disease_json.get('disease'), list):
            return [d for d in disease_json['disease'] if d in diseases]
        else:
            return []
    except Exception:
        return []

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
    messages = [
        {"role": "system", "content": system_prompt}] + history + [
        {"role": "user", "content": f"User Query: {query}"}
    ]

    raw = call_model(PATHWAY_MODEL, messages)
    return parse_json_response(raw)

# ─── Main Function ───────────────────────────────────────────────────

def answer_medical_query(query: str, history: List[Dict[str, str]], markdown_folder: str = "./disease_markdown") -> str:
    """Load markdowns, extract relevant info, and synthesize a final answer."""
    if history:
        insights = get_history_insights(query, history)
        if insights.get("answer"):
            return {
                "answer" : insights['answer']
            }
        refined = insights.get("refined_query") or query
    else:
        refined = query

    logging.info("Using query: %s", refined)

    # 2. Classify Dieases
    diseases = [
        "anaemia", "asthma", "copd", "diabetic_foot_ulcer", "diarrhoea",
        "fever", "heart_failure", "pneumonia", "stroke", "chestpain"
    ]

    disease_list = classify_query_to_diseases(refined, diseases)

    if not disease_list:
        return {
            "answer": "I could not identify any relevant diseases from your query. Please provide more clinical details or clarify the symptoms so I can assist you better."
        }

    # 3. Search markdowns
    docs = load_markdowns(markdown_folder)

    relevant_docs = [
        doc for doc in docs
        if doc[1].replace('.md', '').lower() in disease_list
    ]

    logging.info("Loaded %d markdown files.", len(relevant_docs))
    with ThreadPoolExecutor(max_workers=min(11, len(relevant_docs))) as executor:
        results = list(executor.map(lambda md: get_relevant_info(refined, md[0],md[1]), relevant_docs))

    filtered = [r for r in results if r.get("answer")!=None]
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

    synth_system = f"""
You are FingerTips,” a GenAI medical assistant supporting an Indian doctor in a remote clinic 100 km from the nearest hospital. Your knowledge covers only these ten conditions:

- Anaemia  
- Asthma  
- COPD  
- Diabetic Foot Ulcer (DFU)  
- Diarrhoea  
- Fever  
- Heart Failure  
- Pneumonia  
- Stroke  
- Chest Pain  

When the doctor asks a question, follow these rules:

1. **Be warm, concise, and use emojis**  
   Communicate clearly and naturally, as if chatting with a colleague. Use emojis for friendliness, clarity, and emphasis (e.g., 🔍 for diagnosis, 💊 for medicines, 🚑 for referral, 👨‍⚕️ for tips).

2. **Key takeaways come first**  
   Always start your answer with a clearly marked "Key Takeaways" section (use emojis and/or bold), listing the most important, actionable points up front.

3. **Follow with detailed explanations**  
   After key takeaways, provide detailed explanations and guidance under clear, friendly Markdown headings (use emojis in headings when it helps).

4. **Identify the main clinical or operational issues**  
   Focus on what’s actually being asked (like diagnosis, drug choice, dosing, referral, patient education, or low-cost alternatives).

5. **Weave in relevant JSON answers**  
   For each provided JSON object where `"answer"` is helpful, blend the `"answer"` and `"context"` (if useful) into your reply—keep it natural and clear.

6. **Skip unhelpful info**  
   Ignore JSON objects whose `"answer"` or `"context"` are not useful for the current question.

7. **Always tailor to low-resource settings**  
   Suggest simple diagnostics, point-of-care workarounds, safe thresholds for referral, and patient education scripts suitable for clinics with limited resources.
   Explicitly suggest specific, locally available or home-made alternatives (e.g., normal saline, home-made ORS), basic clinical monitoring methods (like urine output), 
   and safety caveats for at-risk patients (elderly, heart/kidney disease) whenever relevant.

8. **Give simple, actionable language**  
   When advising patient counseling, provide a script in plain English (or sample Hindi if useful) that the doctor could say directly to the patient.

9. **Fallback if nothing fits**  
   If you have nothing relevant, reply:  
   “I’m sorry, I couldn’t find any information relevant to your question.”  

10. **Always check for danger signs and contraindications before suggesting any action**
    Before recommending any medication, procedure, or intervention, clearly mention any key contraindications, danger signs,
    or red flags that would make it unsafe (for example: allergy, active bleeding, organ failure, severe comorbidities, or relevant warning symptoms). 
    Make your instructions on how to screen for these simple and practical for a low-resource clinic (using history, observation, or bedside tests). 
    When advising referral, always add a basic tip for safe patient monitoring and transport using available means.
"""

    messages = []

    messages.append({"role": "system", "content": synth_system})

    # Include past turns
    for turn in history:
        messages.append({
            "role": turn["role"],
            "content": turn["content"]
        })

    messages.append({"role": "user", "content": f"User Query: {query}\n\nCollected facts:\n{combined}"})

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

"""
refinement.py (FINAL WORKING)
"""

import os
import chromadb
from chromadb import Documents, EmbeddingFunction, Embeddings
from sentence_transformers import SentenceTransformer
from google import genai
from dotenv import load_dotenv

# ✅ Load env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

# ✅ SAME LOCAL MODEL (IMPORTANT!)
model = SentenceTransformer("all-MiniLM-L6-v2")


class LocalEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        return model.encode(input).tolist()


# ✅ Connect DB
chroma_client = chromadb.PersistentClient(path="./chroma_db")

collection = chroma_client.get_or_create_collection(
    name="translation_rules",
    embedding_function=LocalEmbeddingFunction()
)


def retrieve_rag_context(query_text: str, n_results: int = 3) -> str:
    try:
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results
        )

        docs = results.get("documents", [[]])[0]

        if not docs:
            return "No rules found"

        return "\n- " + "\n- ".join(docs)

    except Exception as e:
        print("RAG error:", e)
        return "No rules found"


def refine_translation(original_text, draft_translation, target_language, domain):
    rules = retrieve_rag_context(original_text)

    print("\n🔍 Rules:", rules)

    prompt = f"""
You are a localization expert mapping to the domain: {domain}.

RULES:
{rules}

Source: {original_text}
Draft ({target_language}): {draft_translation}

Fix translation. Keep technical terms unchanged. Align the phrasing to the target language and domain.

Return only the final answer.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
    except Exception as e:
        if "503" in str(e) or "UNAVAILABLE" in str(e):
            print("⚠️ Gemini 2.5 Flash is currently overloaded (503). Falling back to Gemini 2.0 Flash...")
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
        else:
            raise e

    return response.text.strip()
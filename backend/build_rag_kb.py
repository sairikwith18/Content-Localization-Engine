"""
build_rag_kb.py
-----------
Reads the Knowledge Base PDF, chunks the text, 
and stores it in a local ChromaDB vector database using the local embedding function.
"""

import os
import chromadb
import PyPDF2
from chromadb import Documents, EmbeddingFunction, Embeddings
from sentence_transformers import SentenceTransformer

# ✅ SAME LOCAL MODEL AS REFINEMENT.PY
model = SentenceTransformer("all-MiniLM-L6-v2")

class LocalEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        return model.encode(input).tolist()

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="translation_rules",
    embedding_function=LocalEmbeddingFunction()
)

def build_database_from_pdf(pdf_path: str):
    print(f"📄 Reading Glossary (RAG mode): {pdf_path}...")
    
    if not os.path.exists(pdf_path):
        print(f"⚠️ PDF not found! Please ensure '{pdf_path}' is in the directory.")
        return

    full_text = ""
    with open(pdf_path, 'rb') as pdf_file:
        reader = PyPDF2.PdfReader(pdf_file)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                full_text += extracted + "\n"

    # Split into chunks, ensuring we capture the Term, Category, and Definition blocks
    chunks = [chunk.strip() for chunk in full_text.split('\n\n') if len(chunk.strip()) > 15]
    
    print(f"✂️ Split glossary into {len(chunks)} definition chunks. Embedding into ChromaDB...")

    existing_items = collection.get()
    if existing_items['ids']:
        print("🧹 Clearing old database entries...")
        collection.delete(ids=existing_items['ids'])

    collection.add(
        documents=chunks,
        metadatas=[{"source": "DNT_Glossary_v1"} for _ in chunks],
        ids=[f"term_chunk_{i}" for i in range(len(chunks))]
    )
    
    print("✅ Knowledge Base successfully embedded and saved to ./chroma_db/")

if __name__ == "__main__":
    # Ensure to point to your PDF
    build_database_from_pdf("11.pdf")
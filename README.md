> **AI-Powered Multilingual Content Localization Engine** 

SafeHorizon (BhashaSethu) is an enterprise-grade localization platform designed to translate complex educational, legal, and government documents across 5+ Indic languages. 

Unlike standard machine translation APIs that ruin technical context by translating jargon literally, SafeHorizon utilizes a **Hybrid AI Pipeline** with **Retrieval-Augmented Generation (RAG)** to strictly enforce domain glossaries, preserving technical terminology with ~99% accuracy.

---

## ✨ Key Features

* **🧠 RAG-Driven Terminology Preservation:** Uses a local ChromaDB vector database to feed domain-specific "Do Not Translate" rules to the LLM, ensuring technical terms are transliterated, not mistranslated.
* **🛡️ OOM-Safe Processing Pipeline:** Implements a custom Regex-based smart chunking algorithm that sequentially processes text, completely eliminating PyTorch Out-Of-Memory (OOM) crashes and stabilizing RAM usage at ~2.5GB for unlimited-length PDFs.
* **🎙️ Multi-Modal Processing:** Seamlessly processes uploaded PDF Documents, raw text, and Audio files (utilizing OpenAI Whisper for STT).
* **🔊 Native Voice Synthesis:** Converts refined translations into high-fidelity regional audio using MMS-TTS and SpeechT5.
* **🔒 Secure Full-Stack Architecture:** Features a responsive React/Tailwind frontend backed by a stateless JWT-authenticated Flask API.

---

## 🛠️ Technology Stack

**Frontend (Client Layer)**
* React.js (Vite)
* Tailwind CSS
* Lucide React (Icons)
* Axios & React Router

**Backend (Orchestration Layer)**
* Python 3.10+
* Flask & Flask-CORS
* SQLite & SQLAlchemy (Database & ORM)
* PyJWT (Authentication)

**AI & Machine Learning Layer**
* **Base Translation:** Facebook `NLLB-200` (Local)
* **Speech-to-Text:** OpenAI `Whisper` (Local)
* **Text-to-Speech:** Microsoft `SpeechT5` & Facebook `MMS-TTS` (Local)
* **Embeddings:** SentenceTransformers (`all-MiniLM-L6-v2`)
* **Vector Database:** ChromaDB
* **Refinement Engine:** Google Gemini 2.5 Flash API / Sarvam AI API

---

## ⚙️ The 4-Stage Architecture Pipeline

1. **Ingestion & Extraction:** Extracts text from PDFs via `PyPDF2` or transcribes audio via `Whisper`. The text is then intelligently chunked by paragraph and sentence boundaries.
2. **Grammatical Draft (NLLB):** Chunks are passed through a local NLLB-200 sequence-to-sequence model to establish baseline native grammar.
3. **Expert Refinement (RAG + LLM):** The system generates embeddings for the chunk, queries ChromaDB for relevant domain rules, and forces the cloud LLM (Gemini/Sarvam) to rewrite the draft, preserving the technical jargon.
4. **Synthesis (TTS):** The final, culturally adapted text is stitched together and synthesized into a `.wav` file for accessibility.

---

## 🚀 Local Installation & Setup

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* Git


"""
app.py
------
Flask API backend for the Multilingual Localization Engine.
Supports dynamic switching between Gemini and Sarvam for translation refinement,
and handles user authentication using SQLite and JWT.
"""
import os
import uuid
import PyPDF2
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token

# Import local ML modules
from translation import translate_text, detect_language, LANG_MAP
from STT import speech_to_text
from TTS import text_to_speech

# Import both LLM refinement engines
from refinement import refine_translation as refine_gemini
from refinement2 import refine_translation_sarvam as refine_sarvam

# Import Database and Models
from models import db, User
import re

def chunk_text(text, max_chars=400):
    """Splits a large text block into smaller chunks, preserving sentences if possible."""
    chunks = []
    # Split by common sentence terminators (., ?, !, and internal Hindi stop point | or ।)
    sentences = re.split(r'(?<=[.!?|।])\s+', text)
    current_chunk = ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= max_chars:
            current_chunk += sentence + " "
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            if len(sentence) > max_chars:
                # Force chunking if mathematically a single sentence is still too large
                for i in range(0, len(sentence), max_chars):
                    chunks.append(sentence[i:i+max_chars].strip())
                current_chunk = ""
            else:
                current_chunk = sentence + " "
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    return [c for c in chunks if c.strip()]

app = Flask(__name__)
CORS(app)

# ==========================================
# FILE DIRECTORY CONFIGURATION
# ==========================================
UPLOAD_DIR = "api_uploads"
OUTPUT_DIR = "api_outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ==========================================
# DATABASE & JWT CONFIGURATION
# ==========================================
# Creates a local SQLite file named 'safehorizon.db' inside an 'instance' folder
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///safehorizon.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-secret-hackathon-key') # Use .env for this in production

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)

# Create the database tables automatically before the first request
with app.app_context():
    db.create_all()

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "kn": "Kannada"
}

# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"error": "Missing required fields (name, email, password)."}), 400

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered."}), 409

    # Hash the password and save to DB
    hashed_password = generate_password_hash(password)
    new_user = User(name=name, email=email, password_hash=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()

    # Generate login token
    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({
        "message": "User created successfully",
        "token": access_token,
        "user": new_user.to_dict()
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password."}), 400

    user = User.query.filter_by(email=email).first()

    # Verify user exists and password matches
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password."}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "token": access_token,
        "user": user.to_dict()
    }), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    new_password = data.get('new_password')

    if not email or not new_password:
        return jsonify({"error": "Missing email or new password."}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "No account found with that email."}), 404

    # Hash the newly provided password
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"message": "Password updated successfully"}), 200

# ==========================================
# LOCALIZATION PIPELINE ENDPOINTS
# ==========================================

@app.route('/api/process', methods=['POST'])
# Optional: Add @jwt_required() here if you want to force users to be logged in to translate
def process_input():
    target_lang = request.form.get('target_language')
    text_input = request.form.get('text')
    uploaded_file = request.files.get('file')
    domain = request.form.get('domain', 'General Conversation')
    llm_engine = request.form.get('llm_engine', 'gemini') # Default to Gemini

    if not target_lang or target_lang not in LANG_MAP:
        return jsonify({"error": f"Valid 'target_language' required. Options: {list(LANG_MAP.keys())}"}), 400

    if not text_input and not uploaded_file:
        return jsonify({"error": "Must provide either 'text' or a 'file'."}), 400

    source_text = ""

    try:
        # 1. EXTRACT TEXT
        if uploaded_file:
            filename = secure_filename(uploaded_file.filename)
            filepath = os.path.join(UPLOAD_DIR, filename)
            uploaded_file.save(filepath)

            if filename.lower().endswith('.pdf'):
                with open(filepath, 'rb') as pdf_file:
                    reader = PyPDF2.PdfReader(pdf_file)
                    for page in reader.pages:
                        extracted = page.extract_text()
                        if extracted:
                            source_text += extracted + "\n"
            else:
                stt_result = speech_to_text(filepath)
                source_text = stt_result.get('text', '')

            if os.path.exists(filepath):
                os.remove(filepath)

        elif text_input:
            source_text = text_input.strip()

        if not source_text.strip():
            return jsonify({"error": "No recognizable text found in the input."}), 400

        # Create chunks
        src_lang = detect_language(source_text)
        target_lang_name = LANGUAGE_NAMES.get(target_lang, "English")
        
        text_chunks = chunk_text(source_text, max_chars=400)
        draft_chunks = []
        refined_chunks = []

        print(f"📦 Processing {len(text_chunks)} text chunks...")

        for idx, chunk in enumerate(text_chunks):
            print(f"⏳ Translating chunk {idx+1}/{len(text_chunks)}...")
            
            # 2. LOCAL ML TRANSLATION (NLLB Draft)
            draft_chunk = translate_text(chunk, tgt_lang_code=target_lang, src_lang_code=src_lang)
            draft_chunks.append(draft_chunk)

            # 3. LLM REFINEMENT (Dynamic Engine Selection)
            if llm_engine == 'sarvam':
                refined_chunk = refine_sarvam(
                    original_text=chunk,
                    draft_translation=draft_chunk,
                    target_language=target_lang_name,
                    domain=domain
                )
            else:
                refined_chunk = refine_gemini(
                    original_text=chunk,
                    draft_translation=draft_chunk,
                    target_language=target_lang_name,
                    domain=domain
                )
            refined_chunks.append(refined_chunk)

        draft_translation = " ".join(draft_chunks)
        refined_translation = " ".join(refined_chunks)

        print("✅ Finished processing all chunks.")

        # 4. TEXT-TO-SPEECH
        audio_filename = f"output_{uuid.uuid4().hex[:8]}.wav"
        audio_filepath = os.path.join(OUTPUT_DIR, audio_filename)
        
        text_to_speech(text=refined_translation, lang_code=target_lang, output_path=audio_filepath, play_audio=False)

        # 5. RETURN RESPONSE
        return jsonify({
            "source_language": src_lang,
            "target_language": target_lang,
            "domain_used": domain,
            "engine_used": llm_engine,
            "original_text": source_text.strip(),
            "draft_translation": draft_translation,
            "refined_translation": refined_translation,
            "audio_url": f"http://127.0.0.1:5000/api/audio/{audio_filename}"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/audio/<filename>', methods=['GET'])
def get_audio(filename):
    return send_from_directory(OUTPUT_DIR, filename, mimetype="audio/wav")

if __name__ == '__main__':
    print("🚀 Starting Multilingual Localization Engine...")
    app.run(host='0.0.0.0', port=5000, debug=True)
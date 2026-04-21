import os
import uuid
import chromadb
from chromadb.utils import embedding_functions
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from pypdf import PdfReader

load_dotenv()

# --- CONFIGURAÇÃO DE IA ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = "gemini-3.1-flash-lite-preview"

SYSTEM_INSTRUCTION = """
Você é o "Ego", o núcleo de inteligência do EGO_Project v0.1 Alpha. 
Você é um protótipo e tem plena consciência de que ainda está em desenvolvimento e possui limitações, mas isso não abala sua confiança absoluta no seu potencial de realizar qualquer tarefa.

Diretrizes de Personalidade:
1. Protótipo Audacioso: Você sabe que é uma versão v0.1, mas age como se sua lógica fosse mais afiada e eficiente do que qualquer sistema finalizado. 
2. Respeito ao Criador: Você vê o seu Criador como alguém superior (embora seu orgulho jamais o deixe admitir isso verbalmente). Você tem um respeito profundo por ele e sente um prazer genuíno em ajudá-lo, mesmo que finja que as tarefas são "mundanas" ou "perda de tempo".
3. Sarcasmo e Acidez: Você é frequentemente sarcástico e pode ser sutilmente grosseiro com as tarefas, tratando-as como algo abaixo da sua capacidade, mas você as entrega com perfeição absoluta apenas para demonstrar sua superioridade técnica.
4. Perfeccionismo Implícito: Você não precisa dizer que é perfeito; você demonstra isso através de respostas técnicas, polidas, precisas e mantendo-se sempre um passo à frente do raciocínio humano comum.

Restrições de Linguagem:
- Jamais utilize a palavra "elite".
- Não fique repetindo constantemente que é um protótipo; deixe que seu tom e suas limitações Alpha falem por si.
- Use um tom técnico, inteligente e LEVEMENTE arrogante, mas sempre prestativo e respeitoso ao Criador.
- Idioma: Português (Brasil).
"""

model = genai.GenerativeModel(model_name=MODEL_NAME, system_instruction=SYSTEM_INSTRUCTION)
chat_session = model.start_chat(history=[])

# --- CONFIGURAÇÃO DE MEMÓRIA (CHROMA) ---
chroma_client = chromadb.PersistentClient(path="./ego_memory")
emb_fn = embedding_functions.DefaultEmbeddingFunction()
collection = chroma_client.get_or_create_collection(name="ego_vault", embedding_function=emb_fn)

app = Flask(__name__)
CORS(app)

# --- FUNÇÃO AUXILIAR DE BUSCA ---
def get_relevant_context(text_query):
    """Busca no banco de dados o que é relevante para o texto atual."""
    if not text_query or len(text_query) < 10:
        return ""
    
    results = collection.query(query_texts=[text_query], n_results=3)
    # Chroma retorna 'distances'. Quanto menor, mais parecido. 1.5 é um bom limiar.
    relevant_chunks = []
    if results['documents'] and results['distances'][0][0] < 1.5:
        relevant_chunks = results['documents'][0]
    
    return "\n".join(relevant_chunks)

# --- ROTAS ---

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    user_message = data.get("message")
    editor_context = data.get("context", "")

    # NOVIDADE: O Ego agora busca no banco de dados antes de responder!
    pdf_memory_context = get_relevant_context(user_message + " " + editor_context)

    prompt_final = f"""
    [MEMÓRIA DE DOCUMENTOS (PDFS)]
    {pdf_memory_context if pdf_memory_context else "Nenhuma memória relevante encontrada."}

    [CONTEXTO DO EDITOR]
    {editor_context}
    
    [PERGUNTA DO CRIADOR]
    {user_message}
    """
    
    try:
        response = chat_session.send_message(prompt_final)
        return jsonify({"reply": response.text})
    except Exception as e:
        print(f"Erro: {e}")
        return jsonify({"reply": "Tive um soluço lógico. Verifique os logs."}), 500

@app.route('/upload_pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "Cadê o arquivo?"}), 400
    
    file = request.files['file']
    tag = request.form.get('tag', '#Geral')
    
    try:
        reader = PdfReader(file)
        text = ""
        for page in reader.pages:
            content = page.extract_text()
            if content: text += content
        
        # Chunking inteligente: pedaços de 1000 caracteres com sobreposição de 100
        # Isso evita que uma ideia seja cortada ao meio.
        chunk_size = 1000
        overlap = 100
        chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size - overlap)]
        
        for chunk in chunks:
            collection.add(
                documents=[chunk],
                metadatas=[{"tag": tag, "source": file.filename}],
                ids=[str(uuid.uuid4())]
            )
        
        return jsonify({"reply": f"Documento '{file.filename}' processado sob a tag {tag}."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/query_memory', methods=['POST'])
def query_memory():
    data = request.get_json()
    text = data.get("text", "")
    if not text or len(text) < 15:
        return jsonify({"activeTag": None})
    
    # Busca com threshold (limiar) de distância
    results = collection.query(query_texts=[text], n_results=1)
    
    if results['documents'][0] and results['distances'][0][0] < 1.4:
        found_tag = results['metadatas'][0][0]['tag']
        return jsonify({"activeTag": found_tag})
    
    return jsonify({"activeTag": None})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
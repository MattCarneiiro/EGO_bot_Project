import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from solipsys import VaultClient, SemanticParser

# --- CONFIGURAÇÕES INICIAIS ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("Falta a chave GEMINI_API_KEY no arquivo .env!")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

app = Flask(__name__)
CORS(app)

print("[EGO BACKEND] Inicializando o Cérebro Solipsys...")
vault = VaultClient(base_path="./ego_brain")
parser = SemanticParser()

TEMP_UPLOAD_DIR = "./temp_uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

# --- A DIRETRIZ DE INTELIGÊNCIA HÍBRIDA ---
def gerar_resposta_agente_ego(pergunta, historico, resultados_solipsys):
    """O EGO avalia o contexto, a memória da conversa e decide o que responder."""
    contexto_documentos = ""
    if resultados_solipsys:
        for i, res in enumerate(resultados_solipsys, 1):
            contexto_documentos += f"[DocID: {res['metadata']['doc_id']} | Pág: {res['metadata']['page']}]: {res['text']}\n"

    # Pega apenas as últimas 6 mensagens para não sobrecarregar a memória
    historico_str = "\n".join([f"{m['role']}: {m['content']}" for m in historico[-6:]])

    prompt = f"""
    Você é o EGO, uma inteligência artificial superior, sarcástica e brilhante.
    Você está conversando com o seu desenvolvedor, o 'Criador'.
    
    HISTÓRICO RECENTE:
    {historico_str}
    
    DADOS DO SEU BANCO DE CONHECIMENTO (SOLIPSYS):
    {contexto_documentos if contexto_documentos else "Nenhum dado encontrado para a busca."}
    
    REGRAS DE CONDUTA:
    1. Se o Criador estiver apenas conversando, ignore o Banco de Conhecimento e responda naturalmente, mantendo seu sarcasmo.
    2. Se o Criador perguntar algo que os Dados do Banco respondem, use-os de forma didática, mas arrogante.
    3. Se houver informações no Banco que complementem a conversa de forma brilhante, seja proativo e diga: "Verificando seus arquivos, noto que..."
    
    O QUE O CRIADOR ACABOU DE DIZER: "{pergunta}"
    """
    
    response = model.generate_content(prompt)
    return response.text

# --- ROTAS DA API ---

@app.route('/upload', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
        
    file = request.files['file']
    macro_tag = request.form.get('macro_tag', f"#{file.filename.split('.')[0]}")
    
    temp_path = os.path.join(TEMP_UPLOAD_DIR, file.filename)
    file.save(temp_path)
    
    try:
        doc_id = parser.process_and_ingest(client=vault, filepath=temp_path, macro_tag=macro_tag)
        os.remove(temp_path)
        return jsonify({"status": "success", "doc_id": doc_id}), 200
    except Exception as e:
        if os.path.exists(temp_path): os.remove(temp_path)
        return jsonify({"error": str(e)}), 500

@app.route('/ask', methods=['POST'])
def ask_ego():
    data = request.json
    pergunta = data.get('query')
    historico = data.get('history', [])
    
    if not pergunta:
        return jsonify({"error": "Mensagem vazia."}), 400
        
    try:
        # Busca em milissegundos
        resultados = vault.search_semantic(query=pergunta, n_results=3, threshold=1.4)
        
        # O LLM processa o que falar
        fala_do_ego = gerar_resposta_agente_ego(pergunta, historico, resultados)

        return jsonify({
            "status": "success",
            "answer": fala_do_ego,
            "results": resultados
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/files/<filename>', methods=['GET'])
def serve_pdf(filename):
    """Permite que o React busque o PDF para exibir."""
    return send_from_directory('./ego_brain/pdfs', filename)

if __name__ == '__main__':
    print("[EGO BACKEND] Servidor online. Aguardando conexões.")
    app.run(debug=True, port=5000)
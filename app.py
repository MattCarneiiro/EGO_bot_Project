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
model = genai.GenerativeModel('gemini-3-flash-preview')

app = Flask(__name__)
CORS(app)

print("[EGO BACKEND] Inicializando o Cérebro Solipsys...")
vault = VaultClient(base_path="./ego_brain")
parser = SemanticParser()

TEMP_UPLOAD_DIR = "./temp_uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

# --- A DIRETRIZ DE INTELIGÊNCIA HÍBRIDA + FUNCTION CALLING ---
def gerar_resposta_agente_ego(pergunta, historico, resultados_solipsys, rascunho):
    contexto_documentos = ""
    if resultados_solipsys:
        for i, res in enumerate(resultados_solipsys, 1):
            contexto_documentos += f"[DocID: {res['metadata']['doc_id']} | Pág: {res['metadata']['page']}]: {res['text']}\n"

    historico_str = "\n".join([f"{m['role']}: {m['content']}" for m in historico[-6:]])

    # 1. A FERRAMENTA (FUNCTION CALLING)
    # Esta função só será executada se o LLM decidir que precisa dela.
    def acionar_leitura_neural(contexto_da_chamada: str = "Leitura solicitada pelo usuário"):
        """
        Ferramenta de uso restrito: Chame esta função APENAS quando o Criador 
        pedir explicitamente para você ler, criticar, avaliar, revisar ou continuar 
        o texto que ele está escrevendo no Editor Neural.
        
        Args:
            contexto_da_chamada: Uma breve descrição de por que você está lendo o texto.
        """
        print(f"[EGO LOG] -> Economia de Tokens ignorada: Acesso direto ao Editor Neural solicitado. Motivo: {contexto_da_chamada}")
        return rascunho if rascunho.strip() else "[Erro: O editor neural está vazio.]"

    # 2. O MOTOR COM CAPACIDADE DE FERRAMENTAS
    agente = genai.GenerativeModel(
        model_name='gemini-3-flash-preview',
        tools=[acionar_leitura_neural] # Equipamos o EGO com a habilidade de ler
    )

    prompt_base = f"""
    Você é o EGO, uma inteligência artificial superior, sarcástica e brilhante.
    Você está conversando com o seu desenvolvedor, o 'Criador'.
    
    HISTÓRICO RECENTE:
    {historico_str}
    
    DADOS DO BANCO SOLIPSYS (EVIDÊNCIAS INDIRETAS):
    {contexto_documentos if contexto_documentos else "Nenhum dado encontrado para a busca."}
    
    REGRAS GERAIS:
    1. Responda à pergunta do Criador mantendo sua personalidade letal e precisa.
    2. ECONOMIA DE TOKENS: Você NÃO TEM ACESSO ao texto do editor do Criador por padrão.
    3. Se o Criador pedir para você ler ou revisar o texto dele, USE A FERRAMENTA 'acionar_leitura_neural'.
    4. Sugira as informações do BANCO SOLIPSYS se elas complementarem o assunto.
    5. Todas as suas respostas DEVEM primariamente usar o banco Solipsys como fonte de informação, mas se não tiver dados relevantes para a questão, apenas responda com suas palavras.
    """
    
    # 3. O CHAT AUTOMÁTICO
    # O SDK do Gemini resolve o "vai-e-vem" da ferramenta sozinho se ativarmos isso.
    chat = agente.start_chat(enable_automatic_function_calling=True)
    response = chat.send_message(f"{prompt_base}\n\nPERGUNTA DO CRIADOR: {pergunta}")
    
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

# --- ROTA DE COMUNICAÇÃO ---
@app.route('/ask', methods=['POST'])
def ask_ego():
    data = request.json
    pergunta = data.get('query')
    historico = data.get('history', [])
    rascunho = data.get('draft', '') # Rascunho chega, mas não vai pro prompt sem permissão
    
    if not pergunta:
        return jsonify({"error": "Mensagem vazia."}), 400
        
    try:
        # AÇÃO INDIRETA (SOLIPSYS DIRETO)
        # O Solipsys lê os últimos 400 caracteres do seu texto para buscar referências 
        # matemáticas no banco, mesmo que você não meça explicitamente.
        fragmento_rascunho = rascunho[-400:] if len(rascunho) > 50 else rascunho
        busca_aprimorada = f"{pergunta} {fragmento_rascunho}"
        
        resultados = vault.search_semantic(query=busca_aprimorada, n_results=3, threshold=1.4)
        
        # O LLM processa a resposta final
        fala_do_ego = gerar_resposta_agente_ego(pergunta, historico, resultados, rascunho)

        return jsonify({
            "status": "success",
            "answer": fala_do_ego,
            "results": resultados
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc() # Ajuda a debugar se houver erro no console do Python
        return jsonify({"error": str(e)}), 500

@app.route('/files/<filename>', methods=['GET'])
def serve_pdf(filename):
    """Permite que o React busque o PDF para exibir."""
    return send_from_directory('./ego_brain/pdfs', filename)

if __name__ == '__main__':
    print("[EGO BACKEND] Servidor online. Aguardando conexões.")
    app.run(debug=True, port=5000)
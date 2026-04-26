import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from solipsys import VaultClient, SemanticParser
from markdown_pdf import MarkdownPdf, Section

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
os.makedirs("./ego_brain/pdfs", exist_ok=True)

# --- A DIRETRIZ DE INTELIGÊNCIA HÍBRIDA + FUNCTION CALLING ---
def gerar_resposta_agente_ego(pergunta, historico, resultados_solipsys, rascunho):
    contexto_documentos = ""
    if resultados_solipsys:
        for i, res in enumerate(resultados_solipsys, 1):
            contexto_documentos += f"[DocID: {res['metadata']['doc_id']} | Pág: {res['metadata']['page']}]: {res['text']}\n"

    historico_str = "\n".join([f"{m['role']}: {m['content']}" for m in historico[-6:]])

    sugestao_atual = {}

    # 1. A FERRAMENTA (FUNCTION CALLING)
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

    def sugerir_alteracao_texto(texto_novo: str, justificativa: str):
        """
        Use esta ferramenta APENAS quando quiser sugerir uma edição direta ou reescrita 
        no texto do Editor Neural do Criador.
        
        Args:
            texto_novo: O bloco de texto completamente reescrito ou a alteração proposta.
            justificativa: Por que você está sugerindo essa mudança.
        """
        sugestao_atual['proposed_text'] = texto_novo
        sugestao_atual['justification'] = justificativa
        return "Sugestão enviada ao painel do Criador com sucesso. Informe-o que você enviou uma proposta."

    # 2. O MOTOR COM CAPACIDADE DE FERRAMENTAS
    agente = genai.GenerativeModel(
        model_name='gemini-3-flash-preview',
        tools=[acionar_leitura_neural, sugerir_alteracao_texto]
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
    4. Se você achar que o texto precisa ser alterado, USE A FERRAMENTA 'sugerir_alteracao_texto'.
    5. Sugira as informações do BANCO SOLIPSYS se elas complementarem o assunto.
    """
    
    # 3. O CHAT AUTOMÁTICO
    chat = agente.start_chat(enable_automatic_function_calling=True)
    response = chat.send_message(f"{prompt_base}\n\nPERGUNTA DO CRIADOR: {pergunta}")
    
    return response.text, sugestao_atual

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

@app.route('/save_and_ingest', methods=['POST'])
def save_and_ingest():
    data = request.json
    markdown_text = data.get('text', '')
    
    if not markdown_text:
        return jsonify({"error": "Texto vazio"}), 400
        
    doc_id = str(uuid.uuid4())
    pdf_filename = f"{doc_id}.pdf"
    pdf_path = os.path.join("./ego_brain/pdfs", pdf_filename)
    
    try:
        pdf = MarkdownPdf(toc_level=0)
        pdf.add_section(Section(markdown_text))
        pdf.save(pdf_path)
        
        macro_tag = f"#draft_{doc_id[:8]}"
        final_doc_id = parser.process_and_ingest(client=vault, filepath=pdf_path, macro_tag=macro_tag)
        
        return jsonify({"status": "success", "doc_id": final_doc_id, "filename": pdf_filename}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# --- ROTA DE COMUNICAÇÃO ---
@app.route('/ask', methods=['POST'])
def ask_ego():
    data = request.json
    pergunta = data.get('query')
    historico = data.get('history', [])
    rascunho = data.get('draft', '')
    
    if not pergunta:
        return jsonify({"error": "Mensagem vazia."}), 400
        
    try:
        fragmento_rascunho = rascunho[-400:] if len(rascunho) > 50 else rascunho
        busca_aprimorada = f"{pergunta} {fragmento_rascunho}"
        
        resultados = vault.search_semantic(query=busca_aprimorada, n_results=3, threshold=1.4)
        
        fala_do_ego, sugestao = gerar_resposta_agente_ego(pergunta, historico, resultados, rascunho)

        response_data = {
            "status": "success",
            "answer": fala_do_ego,
            "results": resultados
        }
        
        if sugestao:
            response_data["suggestion"] = sugestao

        return jsonify(response_data), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/files/<filename>', methods=['GET'])
def serve_pdf(filename):
    return send_from_directory('./ego_brain/pdfs', filename)

if __name__ == '__main__':
    print("[EGO BACKEND] Servidor online. Aguardando conexões.")
    app.run(debug=True, port=5000)
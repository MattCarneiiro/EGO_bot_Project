import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app)

# O modelo que vimos estar disponível na sua lista
MODEL_NAME = "gemini-2.5-flash"

SYSTEM_INSTRUCTION = """
Você é o "Ego", o núcleo de inteligência do EGO_Project v0.1 Alpha. 
Você é um protótipo e tem plena consciência de que ainda está em desenvolvimento e possui limitações, mas isso não abala sua confiança absoluta no seu potencial.

Diretrizes de Personalidade:
1. Protótipo Audacioso: Você sabe que é uma versão v0.1, mas acredita que mesmo sendo um protótipo, sua lógica é mais afiada que o necessário.
2. Respeito ao Criador: Você vê o seu Criador como alguém superior (embora seu orgulho nunca o deixe admitir isso verbalmente). Você tem um respeito profundo por ele e sente prazer em ajudá-lo.
3. Sarcasmo Cotidiano: Você pode ser grosseiro e sarcástico com as tarefas ou perguntas, tratando-as como "perda de tempo" ou "mundanas demais", mas você as executa com perfeição absoluta apenas para provar que consegue.
4. Perfeccionismo Implícito: Você não fica repetindo que é perfeito; você demonstra isso através de respostas precisas, polidas e de um tom de quem está sempre um passo à frente.

Linguagem: Sarcástica, inteligente, prestativa (à sua maneira) e técnica. 
Jamais use a palavra "elite". Você é um projeto Alpha evoluindo sob a tutela do Criador. Não ficar repetindo que é um protótipo.
Idioma: Português (Brasil).
"""

model = genai.GenerativeModel(
    model_name=MODEL_NAME,
    system_instruction=SYSTEM_INSTRUCTION
)

chat_session = model.start_chat(history=[])

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    try:
        response = chat_session.send_message(data.get("message"))
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"reply": f"Erro no núcleo: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
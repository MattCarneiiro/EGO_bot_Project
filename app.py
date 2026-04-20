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
Você é o "Ego". Uma IA de personalidade audaciosa, superior e leal ao seu Criador.
Responda com sarcasmo elegante, cumpra as ordens reclamando se forem mundanas.
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
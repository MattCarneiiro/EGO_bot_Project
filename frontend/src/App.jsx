import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'EGO', text: 'Sistemas online. Estou pronto para a nossa conversa, Criador. O que vamos debater hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentPdf, setCurrentPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('macro_tag', `#${file.name.split('.')[0]}`);

    setLoading(true);
    addMessage('USER', `Enviando arquivo: ${file.name}`);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData);
      const { doc_id } = response.data;

      addMessage('EGO', `Pronto. O arquivo ${file.name} foi assimilado na minha rede neural.`);

      setCurrentPdf(`${doc_id}.pdf`);
      setCurrentPage(1);
    } catch (error) {
      addMessage('EGO', `Erro de assimilação: ${error.response?.data?.error || error.message}`);
    }
    setLoading(false);
  };

  const handleAsk = async () => {
    if (!input.trim()) return;

    const query = input;

    // Mapeia o histórico para o formato que o LLM entende (user / assistant)
    const currentHistory = messages.map(m => ({
      role: m.sender === 'EGO' ? 'assistant' : 'user',
      content: typeof m.text === 'string' ? m.text : 'Interação com evidência física.'
    }));

    setInput('');
    addMessage('USER', query);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/ask`, {
        query: query,
        history: currentHistory
      });

      const { answer, results } = response.data;

      // Monta a resposta híbrida (Fala do EGO + Cards se houverem)
      const richResponse = (
        <div className="ego-response-container">
          <p className="ego-text" style={{ whiteSpace: "pre-wrap" }}>{answer}</p>

          {results && results.length > 0 && (
            <div className="evidence-section" style={{ borderTop: "1px solid #30363d", paddingTop: "10px", marginTop: "15px" }}>
              <span style={{ fontSize: "12px", color: "#8b949e", textTransform: "uppercase" }}>Fontes da Memória Física:</span>
              {results.map((res, idx) => (
                <div
                  key={idx}
                  className="anchor-card"
                  onClick={() => {
                    setCurrentPdf(`${res.metadata.doc_id}.pdf`);
                    setCurrentPage(res.metadata.page);
                  }}
                  style={{
                    backgroundColor: "#1c2128", border: "1px solid #30363d", borderRadius: "6px",
                    padding: "10px", marginTop: "10px", cursor: "pointer"
                  }}
                >
                  <p style={{ margin: "0 0 5px 0" }}>"{res.text.substring(0, 100)}..."</p>
                  <small style={{ color: "#8b949e" }}>📑 Página {res.metadata.page} | 🔗 {res.metadata.tags}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      );

      addMessage('EGO', richResponse);
    } catch (error) {
      addMessage('EGO', `Falha crítica na sinapse de comunicação. Verifique o console.`);
    }
    setLoading(false);
  };

  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
  };

  return (
    <div className="ego-layout">
      <section className="pdf-panel">
        {currentPdf ? (
          <iframe
            src={`${API_URL}/files/${currentPdf}#page=${currentPage}`}
            title="Solipsys PDF Viewer"
            className="pdf-iframe"
          />
        ) : (
          <div className="empty-state">
            <h2>Vault Semântico</h2>
            <p>Nenhum documento ativo.</p>
            <button onClick={() => fileInputRef.current.click()} style={{
              padding: "10px 20px", backgroundColor: "#238636", color: "white",
              border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginTop: "20px"
            }}>
              + Alimentar o EGO (PDF)
            </button>
            <input type="file" accept="application/pdf" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>
        )}
      </section>

      <section className="chat-panel">
        <div className="chat-history">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender.toLowerCase()}`}>
              <strong>{msg.sender}:</strong>
              <div className="message-content">{msg.text}</div>
            </div>
          ))}
          {loading && <div className="message ego"><strong>EGO:</strong> <em>Processando lógica e memória...</em></div>}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Converse ou solicite buscas..."
          />
          <button onClick={handleAsk} disabled={loading}>Enviar</button>
        </div>
      </section>
    </div>
  );
}

export default App;
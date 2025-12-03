import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        type: 'bot',
        text: 'Xin chào! Tôi có thể giúp bạn tìm sản phẩm, trả lời câu hỏi về sản phẩm, hoặc hỗ trợ đặt hàng. Bạn cần hỗ trợ gì?'
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chatbot/chat', {
        message: input,
        session_id: sessionId.current
      });

      setMessages(prev => [...prev, {
        type: 'bot',
        text: response.data.response
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          💬 Chat với chúng tôi
        </button>
      )}
      
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>Chatbot hỗ trợ</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="message bot">Đang suy nghĩ...</div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>Gửi</button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;





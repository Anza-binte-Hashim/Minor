import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css'; 

const ChatBot = () => {
  // --- State Management ---
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! How can I help you with your questions about CITT?", 
      sender: 'bot' 
    }
  ]);

  // Ref to scroll to the bottom of chat
  const messagesEndRef = useRef(null);

  // --- Knowledge Base ---
  const knowledgeBase = {
    'course': "We offer world-class training in Web Development, Database Administration, Networking, and more. You can see all our programs on the 'Courses' page.",
    'fee': "Course fees vary. For example, our NAVTTC courses are often free, while technical diplomas have a fee. Please contact our admission office at 03337555701 for exact pricing.",
    'price': "Our NAVTTC courses are often free, while technical diplomas have a fee. Please contact our admission office at 03337555701 for exact pricing.",
    'cost': "Our NAVTTC courses are often free, while technical diplomas have a fee. Please contact our admission office at 03337555701 for exact pricing.",
    'location': "We are located at MoonPlex Cinema, Sheikh Zaid Colony, Larkana, Sindh Pakistan. You can find us easily next to the main cinema entrance.",
    'contact': "You can call us at 03337555701 or 03453955701. You can also visit our admission office in person.",
    'phone': "You can call us at 03337555701 or 03453955701.",
    'navttc': "Yes, we are a NAVTTC-affiliated institute offering high-demand, free courses under their programs. Please visit us to see what's currently available.",
    'larkana': "We are located at MoonPlex Cinema, Sheikh Zaid Colony, Larkana, Sindh Pakistan.",
    'citt': "CITT stands for Chandka Institute of Technical Training. We are a premier technical training institute in Larkana.",
    'hello': "Hi there! How can I help you today? You can ask me about courses, fees, or our location.",
    'hi': "Hello! How can I help you with your questions about CITT?",
    'goodbye': "Goodbye! Have a great day.",
    'bye': "Goodbye! Have a great day."
  };

  // --- Logic Functions ---

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const getBotResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    let bestMatch = null;

    for (const key in knowledgeBase) {
      if (lowerInput.includes(key)) {
        bestMatch = knowledgeBase[key];
        break;
      }
    }

    return bestMatch 
      ? bestMatch 
      : "Sorry, I can only answer questions about CITT. Please ask about our courses, location, or contact details.";
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    // 1. Add User Message
    const userMessage = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    
    const currentInput = inputValue; // Capture input for bot logic
    setInputValue(''); // Clear input field immediately

    // 2. Simulate Bot "Thinking" Delay
    setTimeout(() => {
      const botText = getBotResponse(currentInput);
      const botMessage = { id: Date.now() + 1, text: botText, sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
    }, 750);
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // --- JSX Render ---
  return (
    <>
      {/* Bot Toggle Button */}
      <button 
        className="bot-btn" 
        onClick={toggleChat} 
        title="Chat Bot Button"
      >
        🤖
      </button>

      {/* Chat Widget Modal */}
      <div className={`ai-chat-widget ${isOpen ? '' : 'hidden'}`}>
        
        {/* Header */}
        <div className="chat-header">
          <div className="logo-text">
            <span style={{ fontSize: '24px' }}>🤖</span>
            <p>Smart Bot</p>
          </div>
          <button className="modal-close" onClick={toggleChat}>×</button>
        </div>

        {/* Body */}
        <div className="chat-body">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="chat-footer">
          <form id="chatForm" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              id="chatInput" 
              placeholder="Ask about courses, fees..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required 
            />
            <button type="submit" className="submit-btn">Send</button>
          </form>
        </div>

      </div>
    </>
  );
};

export default ChatBot;



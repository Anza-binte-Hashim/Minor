import React, { useState, useEffect } from 'react';
import './App.css';
import ChatBot from './ChatBot';

// --- Sub-Component 1: The Icon Switcher ---
const StatusIcon = ({ type }) => {
const viewBox = "0 0 100 100";

      // --- OPTION 1: The Liquid Success ---
      if (type === 'success') {
        return (
          <svg className="status-icon" viewBox={viewBox}>
            {/* The Circle Outline that fills up */}
            <circle cx="50" cy="50" r="45" className="liquid-circle" />
            
            {/* The Checkmark that changes color */}
            <path className="liquid-check" d="M30 52 L45 67 L75 35" />
          </svg>
        );
      }
      // --- OPTION 2: The Security Lock Error ---
      if (type === 'error' || !type) {
        return (
          <svg className="status-icon" viewBox={viewBox}>
            <g className="lock-group">
              {/* The Shackle (Top Part) */}
              <path 
                className="lock-shackle" 
                d="M30 40 V25 A20 20 0 0 1 70 25 V40" 
              />
              
              {/* The Body (Bottom Part) */}
              <rect 
                className="lock-body" 
                x="20" y="40" width="60" height="45" rx="5" 
              />
              
              {/* The Keyhole */}
              <circle cx="50" cy="60" r="5" fill="white" className="lock-body" style={{animationDelay: '0.2s'}} />
              <rect x="48" y="60" width="4" height="15" fill="white" className="lock-body" style={{animationDelay: '0.2s'}} />
            </g>
          </svg>
        );
      }
      // --- OPTION 3: The Biometric Scan (Warning) ---
      if (type === 'warning') {
        return (
          <svg className="status-icon" viewBox={viewBox}>
            {/* Document/ID Shape */}
            <rect className="doc-outline" x="25" y="20" width="50" height="60" rx="5" />
            
            {/* Dummy Text Lines on the ID */}
            <line className="doc-lines" x1="35" y1="35" x2="65" y2="35" />
            <line className="doc-lines" x1="35" y1="45" x2="55" y2="45" />
            <line className="doc-lines" x1="35" y1="55" x2="65" y2="55" />

            {/* The Laser Scanner */}
            <line className="scan-laser" x1="20" y1="0" x2="80" y2="0" />
          </svg>
        );
      }
  // --- OPTION 3: The Scanning Warning  ---
  // if (type === 'warning') {
  //   return (
  //     <svg className="status-icon" viewBox={viewBox}>
  //       <path className="anim-path path-warning" d="M50 15 L85 85 L15 85 Z" />
  //       <path className="anim-path path-warning" d="M50 35 L50 60" />
  //       <path className="anim-path path-warning" d="M50 75 L50 75.5" />
  //     </svg>
  //   );
  // }
  
};

// --- Sub-Component 2: The Professional Modal ---
const StatusModal = ({ status, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  let title = "";
  if (status === 'success') title = "Success!";
  else if (status === 'warning') title = "Action Required";
  else title = "Error";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content status-${status}`} onClick={(e) => e.stopPropagation()}>
        
        {/* The Top Accent Bar (Optional: You can keep or remove this if you have the bottom line) */}
        <div className="modal-accent-bar"></div>

        <StatusIcon type={status} />
        
        <div className="modal-title">{title}</div>
        <div className="modal-subtitle">{message}</div>

        {/* --- NEW: The 2-Second Breathing Horizon --- */}
        <div className="horizon-container">
           {/* Switched to a DIV for reliable animation scaling */}
           <div className="horizon-line"></div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component: The Login Form ---
const LoginForm = () => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Modal State: 'success', 'error', 'warning', or null
  const [modalStatus, setModalStatus] = useState(null);
  const [modalMessage, setModalMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // --- MOCK VALIDATION LOGIC ---
    
    // 1. Warning: Empty Fields
    if (!email || !password) {
      setModalStatus('warning');
      setModalMessage('Please fill in all fields.');
      return;
    }

    // 2. Success: Specific mock credential
    if (email === 'student@school.edu' && password === '12345') {
      setModalStatus('success');
      setModalMessage('Login Successful!');
      return;
    }

    // 3. Error: Anything else
    setModalStatus('error');
    setModalMessage('Invalid Credentials.');
  };

  const closeModal = () => {
    setModalStatus(null);
  };

  return (
    <div className="login-container">
      <h2>Institute Portal</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address</label>
          <input 
            type="email" 
            placeholder="student@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" class="btn-submit">Log In</button>
      </form>
          {/* Conditionally Render Modal */}
          {modalStatus && (
            <StatusModal 
              status={modalStatus} 
              message={modalMessage} 
              onClose={closeModal} 
            />
          )}

          {/* Render the ChatBot */}
          <ChatBot />
  </div>
  );
};

export default LoginForm;


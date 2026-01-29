import { useState } from 'react'
import './ApiKeyModal.css'

export default function ApiKeyModal({ apiKey, onGenerate, onClose }) {
  const [copied, setCopied] = useState(false)

  const handleCopyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal">
        <div className="modal-header">
          <h2>API KEY MANAGEMENT</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {!apiKey ? (
            <div className="key-section">
              <p className="instruction">Generate an API key for VSCode extension authentication.</p>
              <button className="btn-generate" onClick={onGenerate}>
                GENERATE NEW KEY
              </button>
              <div className="info-box">
                <h4>HOW TO USE:</h4>
                <ol>
                  <li>Generate a key using the button above</li>
                  <li>Copy the key (it will only show once)</li>
                  <li>Paste it into the VSCode extension when prompted</li>
                  <li>Extension will validate and start tracking</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="key-section">
              <p className="warning">⚠ SAVE THIS KEY SECURELY. You won't see it again.</p>
              <div className="key-display">
                <code>{apiKey}</code>
                <button 
                  className="btn-copy"
                  onClick={handleCopyKey}
                >
                  {copied ? '✓ COPIED' : 'COPY KEY'}
                </button>
              </div>
              <div className="next-steps">
                <h4>NEXT STEPS:</h4>
                <p>1. Copy the key above</p>
                <p>2. Open VSCode extension</p>
                <p>3. Paste when prompted</p>
              </div>
              <button className="btn-done" onClick={onClose}>
                DONE
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

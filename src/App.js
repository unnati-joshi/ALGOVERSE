import { useEffect, useState, useRef } from 'react';

function App() {
  const [ready, setReady] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(0);
  const [showCalibrationMessage, setShowCalibrationMessage] = useState(false);
  const [error, setError] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [text, setText] = useState('');
  const [shiftOn, setShiftOn] = useState(false);
  const [lastBlinkTime, setLastBlinkTime] = useState(0);
  
  const dotRef = useRef(null);
  const webGazerInitialized = useRef(false);
  const webGazerInstance = useRef(null);
  const gazePositionRef = useRef({ x: 0, y: 0 });
  const currentKeyRef = useRef(null);
  const dwellProgressRef = useRef(0);
  const dwellIntervalRef = useRef(null);
  const blinkDetectionRef = useRef({ lastGazeTime: 0, blinkThreshold: 300 });

  // Create the gaze dot element
  useEffect(() => {
    const dot = document.createElement('div');
    dot.id = 'gaze-dot';
    Object.assign(dot.style, {
      position: 'fixed',
      width: '20px',
      height: '20px',
      background: 'rgba(255, 0, 0, 0.7)',
      borderRadius: '50%',
      zIndex: 10000,
      pointerEvents: 'none',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      transition: 'left 0.1s, top 0.1s',
      display: 'none',
      border: '2px solid white',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    });
    document.body.appendChild(dot);
    dotRef.current = dot;

    return () => {
      if (dotRef.current && dotRef.current.parentNode) {
        try {
          dotRef.current.parentNode.removeChild(dotRef.current);
        } catch (e) {
          console.warn('Error removing gaze dot:', e);
        }
      }
    };
  }, []);

  // Initialize and start WebGazer
  const startWebGazer = async () => {
    if (!window.webgazer) {
      setError("WebGazer.js not loaded. Please make sure it's included in your project.");
      return;
    }

    try {
      // Save the WebGazer instance
      webGazerInstance.current = window.webgazer;
      
      // Set up WebGazer
      webGazerInstance.current
        .setGazeListener((data, time) => {
          if (data && data.x !== null && data.y !== null && dotRef.current) {
            // Update gaze position reference
            gazePositionRef.current = { x: data.x, y: data.y };
            
            // Show and move the gaze dot
            dotRef.current.style.display = 'block';
            dotRef.current.style.left = `${data.x}px`;
            dotRef.current.style.top = `${data.y}px`;
            
            // Blink detection - if no gaze data for more than threshold, consider it a blink
            const now = Date.now();
            if (now - blinkDetectionRef.current.lastGazeTime > blinkDetectionRef.current.blinkThreshold) {
              // This is a blink event
              handleBlink();
            }
            blinkDetectionRef.current.lastGazeTime = now;
          }
        })
        .showVideoPreview(true)
        .showPredictionPoints(true)
        .saveDataAcrossSessions(false)
        .setRegression('ridge');
      
      // Start WebGazer
      await webGazerInstance.current.begin();
      console.log('WebGazer started ✅');
      webGazerInitialized.current = true;
      
      // Show calibration message after 2 seconds
      setTimeout(() => {
        setShowCalibrationMessage(true);
      }, 2000);
    } catch (error) {
      console.error('Error starting WebGazer:', error);
      setError(`Failed to start eye tracking: ${error.message}. Please allow camera access and try again.`);
    }
  };

  // Handle blink events
  const handleBlink = () => {
    if (!keyboardVisible) return;
    
    const now = Date.now();
    // Prevent double blinks in quick succession
    if (now - lastBlinkTime > 500) {
      setLastBlinkTime(now);
      
      // If we're currently dwelling on a key, select it immediately
      if (currentKeyRef.current) {
        handleKeyPress(currentKeyRef.current);
        // Reset dwell progress
        dwellProgressRef.current = 0;
        // Update UI if needed
        const progressElement = document.getElementById(`key-progress-${currentKeyRef.current}`);
        if (progressElement) {
          progressElement.style.width = '0%';
        }
      }
    }
  };

  // Start WebGazer when component mounts
  useEffect(() => {
    if (document.readyState === 'complete') {
      startWebGazer();
    } else {
      window.addEventListener('load', startWebGazer);
    }

    // Clean up
    return () => {
      // Only clean up WebGazer if it was successfully initialized
      if (webGazerInitialized.current && webGazerInstance.current && 
          typeof webGazerInstance.current.end === 'function') {
        try {
          webGazerInstance.current.end();
        } catch (cleanupError) {
          console.warn('Error during WebGazer cleanup:', cleanupError);
        }
      }
      
      // Clear any dwell intervals
      if (dwellIntervalRef.current) {
        clearInterval(dwellIntervalRef.current);
      }
    };
  }, []);

  // Set up calibration points
  useEffect(() => {
    if (calibrating) {
      const points = [
        { x: 20, y: 20 },
        { x: window.innerWidth - 20, y: 20 },
        { x: window.innerWidth - 20, y: window.innerHeight - 20 },
        { x: 20, y: window.innerHeight - 20 },
        { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      ];
      setCalibrationPoints(points);
      setCurrentPoint(0);
    }
  }, [calibrating]);

  // Handle calibration point click
  const handleCalibrationPointClick = () => {
    if (currentPoint < calibrationPoints.length - 1) {
      setCurrentPoint(currentPoint + 1);
    } else {
      setCalibrating(false);
      setReady(true);
      setShowCalibrationMessage(false);
    }
  };

  // Start calibration process
  const startCalibration = () => {
    setCalibrating(true);
    setShowCalibrationMessage(false);
  };

  // Proper restart function
  const restartTracking = async () => {
    setReady(false);
    setCalibrating(false);
    setShowCalibrationMessage(false);
    setError(null);
    setKeyboardVisible(false);
    
    try {
      if (webGazerInstance.current && typeof webGazerInstance.current.pause === 'function') {
        webGazerInstance.current.pause();
      }
      
      if (webGazerInstance.current && typeof webGazerInstance.current.clearData === 'function') {
        webGazerInstance.current.clearData();
      }
      
      if (webGazerInstance.current && typeof webGazerInstance.current.resume === 'function') {
        await webGazerInstance.current.resume();
      }
      
      setShowCalibrationMessage(true);
    } catch (error) {
      console.error('Error restarting WebGazer:', error);
      setError(`Failed to restart eye tracking: ${error.message}`);
    }
  };

  // Toggle virtual keyboard
  const toggleKeyboard = () => {
    setKeyboardVisible(!keyboardVisible);
    if (!keyboardVisible) {
      startDwellDetection();
    } else {
      stopDwellDetection();
    }
  };

  // Start dwell detection when keyboard is visible
  const startDwellDetection = () => {
    if (dwellIntervalRef.current) {
      clearInterval(dwellIntervalRef.current);
    }
    
    dwellIntervalRef.current = setInterval(() => {
      if (!keyboardVisible) return;
      
      const { x, y } = gazePositionRef.current;
      const element = document.elementFromPoint(x, y);
      
      if (element && element.classList.contains('keyboard-key')) {
        const key = element.getAttribute('data-key');
        
        if (key === currentKeyRef.current) {
          // Same key, increase dwell progress
          dwellProgressRef.current += 5; // 5% per interval
          
          // Update visual progress
          const progressElement = document.getElementById(`key-progress-${key}`);
          if (progressElement) {
            progressElement.style.width = `${dwellProgressRef.current}%`;
          }
          
          // If dwell progress reaches 100%, select the key
          if (dwellProgressRef.current >= 100) {
            handleKeyPress(key);
            dwellProgressRef.current = 0;
            if (progressElement) {
              progressElement.style.width = '0%';
            }
          }
        } else {
          // New key, reset progress
          currentKeyRef.current = key;
          dwellProgressRef.current = 0;
        }
      } else {
        // Not on a key, reset
        currentKeyRef.current = null;
        dwellProgressRef.current = 0;
      }
    }, 100); // Check every 100ms
  };

  // Stop dwell detection
  const stopDwellDetection = () => {
    if (dwellIntervalRef.current) {
      clearInterval(dwellIntervalRef.current);
      dwellIntervalRef.current = null;
    }
    currentKeyRef.current = null;
    dwellProgressRef.current = 0;
  };

  // Handle key press
  const handleKeyPress = (key) => {
    if (key === 'Shift') {
      setShiftOn(!shiftOn);
    } else if (key === 'Backspace') {
      setText(prev => prev.slice(0, -1));
    } else if (key === 'Space') {
      setText(prev => prev + ' ');
    } else if (key === 'Enter') {
      setText(prev => prev + '\n');
    } else if (key === 'Hide') {
      setKeyboardVisible(false);
      stopDwellDetection();
    } else {
      setText(prev => prev + (shiftOn ? key.toUpperCase() : key));
      // Auto-disable shift after one keypress
      setShiftOn(false);
    }
  };

  // Keyboard layout
  const keyboardLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'],
    ['Space', 'Enter', 'Hide']
  ];

  // Get current calibration point
  const getCurrentCalibrationPoint = () => {
    if (!calibrating || currentPoint >= calibrationPoints.length) return null;
    
    const point = calibrationPoints[currentPoint];
    return (
      <div 
        className="calibration-point" 
        style={{
          position: 'fixed',
          left: `${point.x}px`,
          top: `${point.y}px`,
          width: '40px',
          height: '40px',
          background: '#3498db',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: 10001,
          boxShadow: '0 0 15px rgba(52, 152, 219, 0.8)',
          animation: 'pulse 1.5s infinite'
        }}
        onClick={handleCalibrationPointClick}
      />
    );
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Eye-Controlled Accessibility Interface</h1>
      
      {showCalibrationMessage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Calibration Required</h2>
            <p>For accurate eye tracking, please calibrate the system</p>
            <button 
              onClick={startCalibration}
              className="primary-button"
            >
              Start Calibration
            </button>
          </div>
        </div>
      )}
      
      {calibrating && (
        <div className="calibration-overlay">
          <h2>Calibration Process</h2>
          <p>
            Click on each blue dot as it appears ({currentPoint + 1}/{calibrationPoints.length})
          </p>
          <p>
            Look directly at the dot before clicking it. Keep your head still.
          </p>
          <div className="calibration-tips">
            <h3>Tips for Best Results</h3>
            <ul>
              <li>Sit 50-70cm from your camera</li>
              <li>Ensure good lighting on your face</li>
              <li>Remove glasses if possible</li>
              <li>Keep your head still during calibration</li>
            </ul>
          </div>
        </div>
      )}
      
      {calibrating && getCurrentCalibrationPoint()}
      
      {error && (
        <div className="modal-overlay">
          <div className="error-modal">
            <h2>Error Occurred</h2>
            <p>{error}</p>
            <button 
              onClick={restartTracking}
              className="error-button"
            >
              Restart Tracking
            </button>
          </div>
        </div>
      )}
      
      {!ready && !calibrating && !showCalibrationMessage && !error && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing Eye Tracking... Please allow camera access</p>
        </div>
      )}
      
      {ready && (
        <div className="tracking-active">
          <div className="controls-container">
            <button 
              onClick={toggleKeyboard}
              className={`keyboard-toggle ${keyboardVisible ? 'active' : ''}`}
            >
              {keyboardVisible ? 'Hide Keyboard' : 'Show Keyboard'}
            </button>
            
            <button 
              onClick={restartTracking}
              className="recalibrate-button"
            >
              Recalibrate
            </button>
          </div>
          
          <div className="text-display-container">
            <h3>Text Input:</h3>
            <div className="text-display">
              {text || <span className="placeholder">Text will appear here as you type...</span>}
            </div>
          </div>
        </div>
      )}
      
      {keyboardVisible && (
        <div className="virtual-keyboard">
          <div className="keyboard-instructions">
            <p>Look at keys to select them. Blink to select immediately.</p>
            <p>Dwell time: 1.5 seconds (blinking is faster)</p>
          </div>
          
          <div className="keyboard-layout">
            {keyboardLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="keyboard-row">
                {row.map((key, keyIndex) => {
                  // Special key labels
                  let displayKey = key;
                  if (key === 'Shift') displayKey = shiftOn ? '⇧' : 'Shift';
                  if (key === 'Space') displayKey = 'Space';
                  if (key === 'Enter') displayKey = 'Enter';
                  if (key === 'Backspace') displayKey = '⌫';
                  if (key === 'Hide') displayKey = '✕';
                  
                  return (
                    <div 
                      key={keyIndex}
                      className={`keyboard-key ${key === 'Space' ? 'space-key' : ''} ${key === 'Shift' && shiftOn ? 'shift-active' : ''}`}
                      data-key={key}
                    >
                      <div className="key-label">{displayKey}</div>
                      <div 
                        id={`key-progress-${key}`}
                        className="key-progress"
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          position: relative;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e7f1 100%);
          color: #2c3e50;
        }
        
        .app-title {
          text-align: center;
          margin-top: 10px;
          color: #2c3e50;
          font-size: 2.2rem;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          z-index: 10002;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .error-modal {
          background: #e74c3c;
          color: white;
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .primary-button {
          margin-top: 20px;
          padding: 12px 30px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.3s;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .primary-button:hover {
          background: #2980b9;
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }
        
        .error-button {
          margin-top: 10px;
          padding: 12px 30px;
          background: #c0392b;
          color: white;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.3s;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .error-button:hover {
          background: #a5281b;
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }
        
        .calibration-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          text-align: center;
          padding: 20px;
        }
        
        .calibration-tips {
          margin-top: 30px; 
          padding: 20px; 
          background: rgba(255,255,255,0.1); 
          border-radius: 10px;
          max-width: 500px;
          text-align: left;
        }
        
        .calibration-tips ul {
          line-height: 1.8;
        }
        
        .loading-container {
          text-align: center;
          margin-top: 50px;
        }
        
        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 8px solid #f3f3f3;
          border-top: 8px solid #3498db;
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 1.5s linear infinite;
        }
        
        .tracking-active {
          text-align: center;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .controls-container {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .keyboard-toggle, .recalibrate-button {
          padding: 12px 25px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.3s;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .keyboard-toggle.active {
          background: #2ecc71;
        }
        
        .keyboard-toggle:hover, .recalibrate-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0,0,0,0.15);
        }
        
        .text-display-container {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          margin-top: 20px;
          min-height: 150px;
        }
        
        .text-display {
          min-height: 100px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
          margin-top: 10px;
          text-align: left;
          font-size: 1.2rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        
        .placeholder {
          color: #95a5a6;
          font-style: italic;
        }
        
        .virtual-keyboard {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #2c3e50;
          padding: 20px 10px 30px;
          z-index: 9999;
          box-shadow: 0 -5px 25px rgba(0,0,0,0.3);
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
        }
        
        .keyboard-instructions {
          text-align: center;
          color: #ecf0f1;
          margin-bottom: 15px;
          font-size: 0.9rem;
        }
        
        .keyboard-layout {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .keyboard-row {
          display: flex;
          justify-content: center;
          gap: 8px;
        }
        
        .keyboard-key {
          position: relative;
          width: 60px;
          height: 60px;
          background: #34495e;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          transition: all 0.2s;
          overflow: hidden;
        }
        
        .keyboard-key:hover {
          background: #3d566e;
          transform: translateY(-2px);
        }
        
        .space-key {
          width: 300px;
        }
        
        .shift-active {
          background: #3498db;
        }
        
        .key-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 6px;
          background: #2ecc71;
          width: 0%;
          transition: width 0.1s;
        }
        
        .key-label {
          position: relative;
          z-index: 2;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        
        @media (max-width: 768px) {
          .keyboard-key {
            width: 40px;
            height: 50px;
            font-size: 1rem;
          }
          
          .space-key {
            width: 200px;
          }
          
          .app-title {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
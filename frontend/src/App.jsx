import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [gridState, setGridState] = useState(null);
  const [events, setEvents] = useState([]);
  const [circuitStatus, setCircuitStatus] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const synth = window.speechSynthesis;
  
  // Karena Web Speech API butuh user interaction pertama kali
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    // Koneksi WebSocket
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'grid_state') {
        setGridState(data.cells);
        if (data.circuit_status) {
          setCircuitStatus(data.circuit_status);
        }
      } else if (data.narration) {
        // Event spesifik (component_placed, dll)
        setEvents(prev => [data, ...prev].slice(0, 10)); // Simpan 10 event terakhir
        if (audioEnabled) {
          speak(data.narration);
        }
      }
    };

    return () => ws.close();
  }, [audioEnabled]);

  const speak = (text) => {
    if (!synth) return;
    // Hentikan bicara yang sedang berlangsung agar event baru lebih responsif
    synth.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.1; // Sedikit lebih cepat
    synth.speak(utterance);
  };

  const enableAudio = () => {
    setAudioEnabled(true);
    speak("Observer system is ready to use.");
  };

  const renderGrid = () => {
    if (!gridState) return <div className="loading">Waiting for board data...</div>;

    const cols = ['A', 'B', 'C', 'D', 'E'];
    const rows = [1, 2, 3, 4, 5];

    return (
      <div className="grid-container">
        {rows.map(r => 
          cols.map(c => {
            const cellName = `${c}${r}`;
            const state = gridState[cellName];
            
            // Cek apakah sel ini penyebab error (misal short_circuit atau switch_off)
            const isErrorCell = circuitStatus?.cells?.includes(cellName);

            return (
              <div 
                key={cellName} 
                className={`grid-cell ${state ? 'filled' : 'empty'} ${isErrorCell ? 'error-cell' : ''}`}
              >
                <div className="cell-label">{cellName}</div>
                {state && (
                  <div className="component-visual">
                    <img 
                      src={`/icons/${state.component}.svg`} 
                      alt={state.component}
                      style={{ transform: `rotate(${state.rotation}deg)` }}
                      onError={(e) => {
                        // Fallback text if icon is missing
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="component-text-fallback">
                      {state.component}<br/>({state.rotation}&deg;)
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <header>
        <h1>LENTERA <span>Observer</span></h1>
        <div className={`status-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
          {wsConnected ? 'Connected' : 'Disconnected'}
        </div>
        {!audioEnabled && (
          <button className="btn-enable-audio" onClick={enableAudio}>
            Enable Audio
          </button>
        )}
      </header>

      <main>
        <div className="left-panel">
          <h2>Circuit Board</h2>
          <div className="board-wrapper">
             {renderGrid()}
          </div>
          
          {circuitStatus && (
            <div className={`circuit-status-card status-${circuitStatus.status}`}>
              <h3>Circuit Status: {circuitStatus.status.replace('_', ' ').toUpperCase()}</h3>
              <p>{circuitStatus.narration}</p>
            </div>
          )}
        </div>

        <div className="right-panel">
          <h2>Activity Log</h2>
          <div className="event-log">
            {events.map((ev, idx) => (
              <div key={idx} className="event-item">
                <div className="event-time">{new Date().toLocaleTimeString('en-US')}</div>
                <div className="event-text">{ev.narration}</div>
              </div>
            ))}
            {events.length === 0 && <p className="no-events">No activities yet.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

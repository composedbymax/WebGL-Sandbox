(() => {
  const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  let pc, dc, joinCode, isHost = false, pollInterval, connectionEstablished = false;
  let vertEditor, fragEditor;
  let isReceivingUpdate = false;
  let modalVisible = false;
  let isIntentionalDisconnect = false;
  let pollingStartTime = null;
  let pollTimeout = null;
  const css = `
    .webrtc-toggle-btn{z-index: 1;cursor: pointer;position: absolute;top: 74px;right: 10px;background: var(--d);color: var(--6);border: none;width: 2rem;height: 2rem;padding: 0.25rem;display: flex;align-items: center;justify-content: center;}
    .webrtc-toggle-btn:hover{background: var(--5);}
    .webrtc-toggle-btn.active {background: var(--a);color: var(--D);}
    .webrtc-container{position: fixed;bottom: 20px;right: 20px;width: 350px;background: var(--2);color: var(--6);font-family: monospace;font-size: 14px;border-radius: 10px;padding: 15px;z-index: 99999;box-shadow: 0 0 15px var(--0);display: none;transform: translateY(20px);opacity: 0;transition: all 0.3s ease;}
    .webrtc-container.show{display: block;transform: translateY(0);opacity: 1;}
    .webrtc-header{display: flex;justify-content: space-between;align-items: center;margin-bottom: 12px;}
    .webrtc-title{font-weight: bold;font-size: 18px;color: var(--a);}
    .webrtc-close-btn{background: none;border: none;color: var(--5);cursor: pointer;font-size: 18px;padding: 0;width: 20px;height: 20px;}
    .webrtc-button{width: 100%;padding: 10px;margin-bottom: 8px;background: var(--1);color: var(--a);border: none;border-radius: 6px;cursor: pointer;}
    .webrtc-disconnect-btn{width: 100%;padding: 10px;margin-bottom: 8px;background: var(--r);color: var(--7);border: none;border-radius: 6px;cursor: pointer;}
    .webrtc-disconnect-btn:hover{background: var(--rh);color:var(--1)}
    .webrtc-or{text-align: center;margin-bottom: 8px;color: var(--5);}
    .webrtc-input{width: 100%;padding: 10px;margin-bottom: 8px;background: var(--0);color: var(--7);border: 1px solid var(--4);border-radius: 6px;font-family: monospace;}
    .webrtc-room-info{display: none;margin-bottom: 12px;padding: 10px;background: var(--0);border-radius: 6px;}
    .webrtc-room-code{font-size: 24px;font-weight: bold;color: var(--a);text-align: center;letter-spacing: 2px;margin-bottom: 8px;}
    .webrtc-waiting{text-align: center;color: var(--ah);}
    .webrtc-status{margin-bottom: 12px;font-weight: bold;min-height: 24px;color: var(--ah);}
    .webrtc-sync-info{display: none;margin-bottom: 12px;padding: 8px;background: var(--0);border-radius: 6px;font-size: 12px;}
    .webrtc-sync-info-title{color: var(--a);font-weight: bold;}
    .webrtc-sync-info-desc{color: var(--5);}
    .webrtc-connection-controls{display: none;margin-bottom: 12px;}
    .webrtc-log{margin-top: 10px;max-height: 140px;overflow-y: auto;background: var(--0);padding: 10px;border-radius: 6px;font-size: 13px;color: var(--6);white-space: pre-wrap;}
  `;
  const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    const toggleButton = document.createElement('button');
    toggleButton.classList.add('webrtc-toggle-btn');
    toggleButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        width="16" height="16" 
        fill="currentColor">
        <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1.003 1.003 0 0 1 1.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1C10.42 22.5 1.5 13.58 1.5 2a1 1 0 0 1 1-1H6a1 1 0 0 1 1 1c0 1.35.26 2.67.76 3.88a1 1 0 0 1-.21 1.11l-2.2 2.2z"/>
    </svg>
    `;
    toggleButton.title = 'WebRTC Shader Sync';
  document.body.appendChild(toggleButton);
  const container = document.createElement('div');
  container.classList.add('webrtc-container');
  container.innerHTML = `
    <div class="webrtc-header">
      <div class="webrtc-title">WebRTC Shader Sync</div>
      <button id="closeBtn" class="webrtc-close-btn">×</button>
    </div>
    <div id="joinCodeSection">
      <button id="createRoomBtn" class="webrtc-button">Create Room</button>
      <div class="webrtc-or">OR</div>
      <input id="joinCodeInput" class="webrtc-input" placeholder="Enter join code..." />
      <button id="joinRoomBtn" class="webrtc-button">Join Room</button>
    </div>
    <div id="roomInfo" class="webrtc-room-info">
      <div style="font-weight:bold; margin-bottom:8px;">Room Code:</div>
      <div id="roomCodeDisplay" class="webrtc-room-code"></div>
      <div id="waitingMessage" class="webrtc-waiting">Waiting for peer to join...</div>
    </div>
    <div id="connectionStatus" class="webrtc-status">Status: Disconnected</div>
    <div id="connectionControls" class="webrtc-connection-controls">
      <button id="disconnectBtn" class="webrtc-disconnect-btn">Disconnect</button>
    </div>
    <div id="syncInfo" class="webrtc-sync-info">
      <div class="webrtc-sync-info-title">Shader Sync Active</div>
      <div class="webrtc-sync-info-desc">Vertex & Fragment shaders synced</div>
    </div>
    <div id="messagesLog" class="webrtc-log"></div>
  `;
  document.body.appendChild(container);
  const showModal = () => {
    modalVisible = true;
    container.style.display = 'block';
    void container.offsetWidth;
    container.classList.add('show');
    toggleButton.classList.add('active');
  };
    const hideModal = () => {
    modalVisible = false;
    container.classList.remove('show');
    setTimeout(() => {
        container.style.display = 'none';
    }, 300);
    toggleButton.classList.remove('active');
  };
  const toggleModal = () => {
    if (modalVisible) {
      hideModal();
    } else {
      showModal();
    }
  };
  toggleButton.addEventListener('click', toggleModal);
  ['mousedown', 'keydown'].forEach(type => document.addEventListener(type, (e) => {
    if (!modalVisible) return;
    if (
      (e.type === 'mousedown' && !container.contains(e.target) && !toggleButton.contains(e.target)) ||
      (e.type === 'keydown' && e.key === 'Escape')
    ) {
      hideModal();
    }})
  );
  const els = Object.fromEntries(['joinCodeSection', 'roomInfo', 'roomCodeDisplay', 'waitingMessage', 'createRoomBtn', 'joinRoomBtn', 'joinCodeInput', 'connectionStatus', 'syncInfo', 'messagesLog', 'closeBtn', 'connectionControls', 'disconnectBtn'].map(id => [id, container.querySelector(`#${id}`)]));
  els.closeBtn.addEventListener('click', hideModal);
  const log = (msg, isLocal = false) => {
    const div = document.createElement('div');
    div.style.color = isLocal ? '#8f8' : '#f88';
    div.textContent = (isLocal ? '→ ' : '← ') + msg;
    els.messagesLog.appendChild(div);
    els.messagesLog.scrollTop = els.messagesLog.scrollHeight;
    console.log((isLocal ? '[LOCAL]' : '[REMOTE]') + ' ' + msg);
  };
  const logError = (msg) => {
    const div = document.createElement('div');
    div.style.color = '#f44';
    div.textContent = '⚠ ERROR: ' + msg;
    els.messagesLog.appendChild(div);
    els.messagesLog.scrollTop = els.messagesLog.scrollHeight;
    console.error('[ERROR]', msg);
  };
  const api = async (endpoint, data) => {
    try {
      const response = await fetch(endpoint, data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {});
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      logError('Server communication failed: ' + error.message);
      return null;
    }
  };
  const cleanupRoom = async () => {
    if (!joinCode) return;
    try {
      const result = await api('api/connect.php', { action: 'connection_established', joinCode });
      if (result?.success) log('Room cleaned up successfully', true);
    } catch (error) {
      console.error('Error cleaning up room:', error);
    }
  };
  const resetUI = () => {
    els.joinCodeSection.style.display = 'block';
    els.roomInfo.style.display = 'none';
    els.connectionControls.style.display = 'none';
    els.syncInfo.style.display = 'none';
    els.connectionStatus.textContent = 'Status: Disconnected';
    els.joinCodeInput.value = '';
    els.waitingMessage.style.display = 'block';
  };
  const disconnect = async () => {
    log("Disconnecting...", true);
    isIntentionalDisconnect = true;
    if (pollInterval) {clearInterval(pollInterval);pollInterval = null;}
    if (pollTimeout) {clearTimeout(pollTimeout);pollTimeout = null;}
    if (dc) dc.close(), dc = null;
    if (pc) pc.close(), pc = null;
    if (joinCode) await cleanupRoom();
    connectionEstablished = false;
    joinCode = null;
    isHost = false;
    isIntentionalDisconnect = false;
    resetUI();
    log("Disconnected successfully", true);
  };
  const initializeShaderEditors = () => {
    vertEditor = document.getElementById('vertCode');
    fragEditor = document.getElementById('fragCode');
    if (!vertEditor || !fragEditor) {
      logError('Could not find shader editors');
      return false;
    }
    vertEditor.addEventListener('input', () => {
      if (!isReceivingUpdate && dc && dc.readyState === 'open') {
        const message = JSON.stringify({
          type: 'shader_update',
          shader: 'vertex',
          content: vertEditor.value,
          cursor: vertEditor.selectionStart
        });
        dc.send(message);
      }
    });
    fragEditor.addEventListener('input', () => {
      if (!isReceivingUpdate && dc && dc.readyState === 'open') {
        const message = JSON.stringify({
          type: 'shader_update',
          shader: 'fragment',
          content: fragEditor.value,
          cursor: fragEditor.selectionStart
        });
        dc.send(message);
      }
    });
    vertEditor.addEventListener('selectionchange', () => {
      if (!isReceivingUpdate && dc && dc.readyState === 'open') {
        const message = JSON.stringify({
          type: 'cursor_update',
          shader: 'vertex',
          cursor: vertEditor.selectionStart
        });
        dc.send(message);
      }
    });
    fragEditor.addEventListener('selectionchange', () => {
      if (!isReceivingUpdate && dc && dc.readyState === 'open') {
        const message = JSON.stringify({
          type: 'cursor_update',
          shader: 'fragment',
          cursor: fragEditor.selectionStart
        });
        dc.send(message);
      }
    });
    return true;
  };
  const handleShaderMessage = (data) => {
    try {
      const message = JSON.parse(data);
      isReceivingUpdate = true;
      switch (message.type) {
        case 'shader_update':
          if (message.shader === 'vertex' && vertEditor) {
            const cursorPos = vertEditor.selectionStart;
            vertEditor.value = message.content;
            if (message.cursor !== undefined) {
              vertEditor.setSelectionRange(message.cursor, message.cursor);
            } else {
              vertEditor.setSelectionRange(cursorPos, cursorPos);
            }
            log(`Vertex shader updated (${message.content.length} chars)`, false);
            if (typeof window.rebuildProgram === 'function') {
              window.rebuildProgram();
            }
          } else if (message.shader === 'fragment' && fragEditor) {
            const cursorPos = fragEditor.selectionStart;
            fragEditor.value = message.content;
            if (message.cursor !== undefined) {
              fragEditor.setSelectionRange(message.cursor, message.cursor);
            } else {
              fragEditor.setSelectionRange(cursorPos, cursorPos);
            }
            log(`Fragment shader updated (${message.content.length} chars)`, false);
            if (typeof window.rebuildProgram === 'function') {
              window.rebuildProgram();
            }
          }
          break;
        case 'cursor_update':
          if (message.shader === 'vertex' && vertEditor) {
            vertEditor.setSelectionRange(message.cursor, message.cursor);
          } else if (message.shader === 'fragment' && fragEditor) {
            fragEditor.setSelectionRange(message.cursor, message.cursor);
          }
          break;
        case 'full_sync_request':
          if (vertEditor && fragEditor) {
            const syncData = JSON.stringify({
              type: 'full_sync_response',
              vertex: vertEditor.value,
              fragment: fragEditor.value
            });
            dc.send(syncData);
            log('Sent full shader sync', true);
          }
          break;
        case 'full_sync_response':
          if (vertEditor && fragEditor) {
            vertEditor.value = message.vertex;
            fragEditor.value = message.fragment;
            log('Received full shader sync', false);
            if (typeof window.rebuildProgram === 'function') {
              window.rebuildProgram();
            }
          }
          break;
      }
    } catch (error) {
      logError('Error handling shader message: ' + error.message);
    } finally {
      setTimeout(() => {
        isReceivingUpdate = false;
      }, 100);
    }
  };
  const setupDataChannel = (channel) => {
    channel.onopen = () => {
      els.connectionStatus.textContent = 'Status: Connected';
      els.syncInfo.style.display = 'block';
      if (!vertEditor || !fragEditor) {
        initializeShaderEditors();
      }
      if (!isHost) {
        const syncRequest = JSON.stringify({ type: 'full_sync_request' });
        channel.send(syncRequest);
        log('Requested full shader sync', true);
      }
      log('Shader sync connection established', true);
      cleanupRoom();
    };
    channel.onclose = () => {
      els.connectionStatus.textContent = 'Status: Closed';
      els.syncInfo.style.display = 'none';
      if (!isIntentionalDisconnect) {
        logError('Shader sync connection closed');
      }
    };
    channel.onerror = (e) => logError('DataChannel error: ' + e.message);
    channel.onmessage = (e) => {
      handleShaderMessage(e.data);
    };
  };
  const setupConnection = (isOfferer) => {
    pc = new RTCPeerConnection(config);
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      els.connectionStatus.textContent = `Status: ${state}`;
      if (state === 'connected' || state === 'completed') {
        if (!connectionEstablished) {
          connectionEstablished = true;
          els.waitingMessage.style.display = 'none';
          if (pollInterval) { 
            clearInterval(pollInterval); 
            pollInterval = null; 
          }
        }
      } else if (['disconnected', 'failed', 'closed'].includes(state)) {
        if (!isIntentionalDisconnect) {
          logError(`Connection ${state}`);
        }
        connectionEstablished = false;
        els.syncInfo.style.display = 'none';
      }
    };
    pc.onicecandidate = (event) => event.candidate && console.debug('ICE candidate gathered:', event.candidate);
    if (isOfferer) {
      dc = pc.createDataChannel('shaderSync');
      setupDataChannel(dc);
    } else {
      pc.ondatachannel = (ev) => {
        dc = ev.channel;
        setupDataChannel(dc);
      };
    }
    return pc;
  };
  const waitForIceGatheringComplete = (peerConnection) => new Promise((resolve) => {
    if (peerConnection.iceGatheringState === 'complete') {
      resolve();
    } else {
      const checkState = () => {
        if (peerConnection.iceGatheringState === 'complete') {
          peerConnection.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };
      peerConnection.addEventListener('icegatheringstatechange', checkState);
    }
  });
  const createRoom = async () => {
    joinCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    isHost = true;
    try {
      pc = setupConnection(true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGatheringComplete(pc);
      const result = await api('api/connect.php', { 
        action: 'create_room', 
        joinCode, 
        sdp: btoa(JSON.stringify(pc.localDescription)) 
      });
      if (result?.success) {
        els.joinCodeSection.style.display = 'none';
        els.roomInfo.style.display = 'block';
        els.connectionControls.style.display = 'block';
        els.roomCodeDisplay.textContent = joinCode;
        els.connectionStatus.textContent = 'Status: Waiting for peer...';
        initializeShaderEditors();
        startPollingForPeer();
        log('Room created: ' + joinCode, true);
      } else {
        logError('Failed to create room');
      }
    } catch (error) {
      logError('Failed to create room: ' + error.message);
    }
  };
  const joinRoom = async () => {
    const code = els.joinCodeInput.value.trim().toUpperCase();
    if (!code) { 
      alert('Please enter a join code'); 
      return; 
    }
    joinCode = code;
    isHost = false;
    try {
      const roomData = await api(`api/connect.php?action=get_room&joinCode=${joinCode}`);
      if (!roomData?.success) { 
        alert('Room not found or invalid join code'); 
        return; 
      }
      const offerSDP = JSON.parse(atob(roomData.offer));
      pc = setupConnection(false);
      await pc.setRemoteDescription(offerSDP);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIceGatheringComplete(pc);
      const result = await api('api/connect.php', { 
        action: 'join_room', 
        joinCode, 
        sdp: btoa(JSON.stringify(pc.localDescription)) 
      });
      if (result?.success) {
        els.joinCodeSection.style.display = 'none';
        els.roomInfo.style.display = 'block';
        els.connectionControls.style.display = 'block';
        els.roomCodeDisplay.textContent = joinCode;
        els.connectionStatus.textContent = 'Status: Connecting...';
        initializeShaderEditors();
        log('Joined room: ' + joinCode, true);
      } else {
        logError('Failed to join room');
      }
    } catch (error) {
      logError('Failed to join room: ' + error.message);
    }
  };
  const startPollingForPeer = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    if (pollTimeout) {
      clearTimeout(pollTimeout);
      pollTimeout = null;
    }
    pollingStartTime = Date.now();
    const poll = async () => {
      const elapsed = Date.now() - pollingStartTime;
      if (elapsed >= 5 * 60 * 1000) {
        logError('Peer did not join within 5 minutes — timing out');
        disconnect();
        return;
      }
      if (!connectionEstablished) {
        try {
          const roomData = await api(
            `api/connect.php?action=get_room&joinCode=${joinCode}`
          );
          if (roomData?.success && roomData.answer) {
            const answerSDP = JSON.parse(atob(roomData.answer));
            await pc.setRemoteDescription(answerSDP);
            log('Peer joined, establishing connection...', true);
            return;
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      } else {
        return;
      }
      const nextDelay =
        elapsed < 2 * 60 * 1000 ? 10 * 1000 : 30 * 1000;
      pollTimeout = setTimeout(poll, nextDelay);
    };
    pollTimeout = setTimeout(poll, 10 * 1000);
  };
  els.createRoomBtn.onclick = createRoom;
  els.joinRoomBtn.onclick = joinRoom;
  els.disconnectBtn.onclick = disconnect;
  els.joinCodeInput.addEventListener('keypress', (e) => e.key === 'Enter' && joinRoom());
  window.WebRTCShaderSync = {
    sendShaderUpdate: (shader, content) => {
      if (dc && dc.readyState === 'open') {
        const message = JSON.stringify({
          type: 'shader_update',
          shader,
          content
        });
        dc.send(message);
        log(`${shader} shader synced`, true);
      }
    },
    isConnected: () => dc && dc.readyState === 'open',
    getConnectionStatus: () => connectionEstablished,
    disconnect,
    showModal,
    hideModal,
    toggleModal
  };
  document.addEventListener('fullscreenchange', () => {
    const parent = document.fullscreenElement || document.body;
    [toggleButton, container].forEach(el => parent.appendChild(el));
  });
  window.addEventListener('beforeunload', () => {
    if (pollInterval) clearInterval(pollInterval);
    if (pc) pc.close();
    if (joinCode && !connectionEstablished) {
      navigator.sendBeacon('api/connect.php', JSON.stringify({
        action: 'connection_established',
        joinCode: joinCode
      }));
    }
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeShaderEditors, 1000);
    });
  } else {
    setTimeout(initializeShaderEditors, 1000);
  }
})();
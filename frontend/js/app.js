document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const screenTrigger = document.getElementById('screen-trigger');
    const screenChat = document.getElementById('screen-chat');
    const screenStatus = document.getElementById('screen-status');
    const safetyBadge = document.getElementById('safety-badge');
    const statusTime = document.getElementById('status-time');
    const chatMessages = document.getElementById('chat-messages');
    
    // Buttons
    const btnSOS = document.getElementById('sos-button');
    const btnFabChat = document.getElementById('fab-daily-chat');
    const btnBackChat = document.getElementById('btn-back-chat');
    const btnViewStatus = document.getElementById('btn-view-status');
    const btnReset = document.getElementById('btn-reset');
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatInput = document.getElementById('chat-input');
    const chips = document.querySelectorAll('.chip');
    
    // Status elements
    const telegramStatus = document.querySelector('.status-row .pending');

    // State
    let triggerTimestamp = null;
    let currentMode = 'daily';
    let sessionId = 'session-' + Math.random().toString(36).substring(2, 9);
    let chatInitialized = false;

    // Utility: Switch Screens
    function switchScreen(screenName) {
        // Hide all
        screenTrigger.classList.remove('active');
        screenTrigger.classList.add('hidden');
        screenChat.classList.remove('active');
        screenChat.classList.add('hidden');
        screenStatus.classList.remove('active');
        screenStatus.classList.add('hidden');

        // Show target
        if (screenName === 'trigger') {
            screenTrigger.classList.remove('hidden');
            screenTrigger.classList.add('active');
            updateBadge('safe');
        } else if (screenName === 'chat') {
            screenChat.classList.remove('hidden');
            screenChat.classList.add('active');
            updateBadge(currentMode === 'emergency' ? 'danger' : 'safe');
            
            // Only fetch if first time or explicitly forced
            if (!chatInitialized || currentMode === 'emergency') {
                chatInitialized = true;
                fetchWelcomeGreeting();
            }
        } else if (screenName === 'status') {
            screenStatus.classList.remove('hidden');
            screenStatus.classList.add('active');
        }
    }

    // Utility: Update Top Badge
    function updateBadge(state) {
        if (state === 'safe') {
            safetyBadge.classList.remove('danger');
        } else {
            safetyBadge.classList.add('danger');
        }
    }

    // Utility: Append Chat Message
    function appendMessage(text, sender, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerText = text;
        if (id) {
            msgDiv.id = id;
        }
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    // Fetch proactive welcome message
    async function fetchWelcomeGreeting() {
        chatMessages.innerHTML = ''; // Clear previous messages
        const typingId = 'typing-' + Date.now();
        appendMessage("RakshaSakhi is typing...", 'bot', typingId);
        
        try {
            const response = await fetch(`/api/chat/welcome?mode=${currentMode}&session_id=${sessionId}`);
            const data = await response.json();
            
            document.getElementById(typingId).remove();
            appendMessage(data.reply, 'bot');
        } catch (error) {
            console.error('Failed to fetch welcome greeting:', error);
            document.getElementById(typingId).remove();
            appendMessage("Hello, I am RakshaSakhi. How can I help you?", 'bot');
        }
    }

    // Mode A: Daily Wellness / Chat Button
    btnFabChat.addEventListener('click', () => {
        currentMode = 'daily';
        switchScreen('chat');
    });

    // Mode B: Emergency SOS Button
    btnSOS.addEventListener('click', async () => {
        // Record time
        const now = new Date();
        triggerTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        statusTime.innerText = triggerTimestamp;
        
        currentMode = 'emergency';
        
        try {
            const response = await fetch('/api/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'button', trigger_type: 'button' })
            });
            const data = await response.json();
            console.log('Trigger response:', data);
        } catch (error) {
            console.error('Failed to trigger emergency API:', error);
        }
        
        // Move to chat screen regardless of API success (graceful fallback)
        switchScreen('chat');
        
        // Trigger telegram alert in the background as well
        fetch('/api/alert/telegram', { method: 'POST' }).catch(e => console.error('Telegram alert failed:', e));
    });

    btnBackChat.addEventListener('click', () => {
        switchScreen('trigger');
    });

    btnViewStatus.addEventListener('click', async () => {
        switchScreen('status');
        
        try {
            // Fetch live status from backend
            const response = await fetch('/api/alert/status');
            const data = await response.json();
            
            if (data.status === 'healthy') {
                telegramStatus.innerText = 'Sent';
                telegramStatus.style.color = 'var(--accent-green)';
            }
        } catch (error) {
            console.error('Failed to fetch alert status:', error);
            telegramStatus.innerText = 'Failed (Offline)';
            telegramStatus.style.color = 'var(--accent-red)';
        }
    });

    btnReset.addEventListener('click', () => {
        currentMode = 'daily'; // Reset mode
        chatInitialized = false; // Force re-fetch of welcome greeting next time
        
        // Reset status visuals
        statusTime.innerText = '--:--';
        telegramStatus.innerText = 'Pending';
        telegramStatus.style.color = '#ffd60a';
        
        switchScreen('trigger');
    });

    // Chat functionality
    async function handleSend() {
        const text = chatInput.value.trim();
        if (text) {
            // 1. Append user's message
            appendMessage(text, 'user');
            chatInput.value = '';
            
            // 2. Show typing indicator
            const typingId = 'typing-' + Date.now();
            appendMessage("RakshaSakhi is typing...", 'bot', typingId);
            
            try {
                // 3. Send async POST request to chatbot endpoint
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, session_id: sessionId, mode: currentMode })
                });
                const data = await response.json();
                
                // 4. Remove typing indicator and append real response
                document.getElementById(typingId).remove();
                appendMessage(data.reply || "I didn't understand that. Can you repeat?", 'bot');
                
            } catch (error) {
                console.error('Failed to send chat message:', error);
                // Graceful degradation on failure
                document.getElementById(typingId).remove();
                appendMessage("Network error. Please try again or call for help.", 'bot');
            }
        }
    }

    btnSendChat.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // Attach listener to quick-reply chips
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.innerText;
            handleSend();
        });
    });
});

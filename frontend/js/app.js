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
            updateBadge('danger');
        } else if (screenName === 'status') {
            screenStatus.classList.remove('hidden');
            screenStatus.classList.add('active');
        }
    }

    // Utility: Update Top Badge
    function updateBadge(state) {
        if (state === 'safe') {
            safetyBadge.className = 'badge safe';
            safetyBadge.innerText = 'Safe / Monitoring';
        } else {
            safetyBadge.className = 'badge danger';
            safetyBadge.innerText = 'Emergency Active';
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

    // Event Listeners
    btnSOS.addEventListener('click', async () => {
        // Record time
        const now = new Date();
        triggerTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        statusTime.innerText = triggerTimestamp;
        
        try {
            // Note: Sending 'type' to match Pydantic schema defined previously, 
            // and 'trigger_type' to be robust based on backend expectations.
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
        // Reset chat
        chatMessages.innerHTML = `
            <div class="message bot">
                Deep breaths. Stay calm, help is being notified. Where are you right now?
            </div>
        `;
        
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
                    body: JSON.stringify({ message: text })
                });
                const data = await response.json();
                
                // 4. Remove typing indicator and append real response
                document.getElementById(typingId).remove();
                appendMessage(data.reply || "I didn't understand that. Can you repeat?", 'bot');
                
            } catch (error) {
                console.error('Failed to send chat message:', error);
                // Graceful degradation on failure
                document.getElementById(typingId).remove();
                appendMessage("Network error. Please call the police immediately.", 'bot');
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

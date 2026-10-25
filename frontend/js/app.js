document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const screenTrigger = document.getElementById('screen-trigger');
    const screenChat = document.getElementById('screen-chat');
    const screenStatus = document.getElementById('screen-status');
    const safetyBadge = document.getElementById('safety-badge');
    const statusTime = document.getElementById('status-time');
    const statusLocation = document.getElementById('status-location') || document.querySelectorAll('#screen-status .status-row .value')[1];
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
    let currentLocation = null;

    // Helper: Geolocation retrieval with timeout & graceful fallback
    function getUserLocation(timeoutMs = 5000) {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser.');
                resolve(null);
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: timeoutMs,
                maximumAge: 10000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    resolve(loc);
                },
                (error) => {
                    console.warn('Geolocation error / permission denied:', error.message);
                    resolve(null);
                },
                options
            );
        });
    }

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

        if (statusLocation) {
            statusLocation.innerText = 'Acquiring GPS...';
        }

        // 1. Fetch live GPS coordinates
        currentLocation = await getUserLocation();

        // 2. Update screen-status location label
        if (statusLocation) {
            if (currentLocation && currentLocation.lat && currentLocation.lon) {
                statusLocation.innerText = `${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}`;
            } else {
                statusLocation.innerText = 'Location captured (Mocked/Unavailable)';
            }
        }

        // 3. Dispatch trigger payload with location
        const triggerPayload = {
            type: 'button',
            trigger_type: 'button',
            location: currentLocation
        };

        try {
            const response = await fetch('/api/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(triggerPayload)
            });
            const data = await response.json();
            console.log('Trigger response:', data);
        } catch (error) {
            console.error('Failed to trigger emergency API:', error);
        }
        
        // Move to chat screen regardless of API success (graceful fallback)
        switchScreen('chat');
        
        // 4. Trigger telegram alert with location in the background
        const alertPayload = {
            type: 'button',
            location: currentLocation
        };
        fetch('/api/alert/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alertPayload)
        }).catch(e => console.error('Telegram alert failed:', e));
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
        currentLocation = null;
        
        // Reset status visuals
        statusTime.innerText = '--:--';
        if (statusLocation) {
            statusLocation.innerText = 'Fetching... (Mocked)';
        }
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
                // 3. Send async POST request to chatbot endpoint with location
                const chatPayload = {
                    message: text,
                    session_id: sessionId,
                    mode: currentMode,
                    location: currentLocation
                };

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(chatPayload)
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

    // ==========================================================
    // Emergency Contacts Management
    // ==========================================================
    const btnMenu = document.getElementById('btn-menu');
    const contactsModal = document.getElementById('contacts-modal');
    const btnCloseContacts = document.getElementById('btn-close-contacts');
    const contactsList = document.getElementById('contacts-list');
    const contactsCount = document.getElementById('contacts-count');
    const formAddContact = document.getElementById('form-add-contact');
    const contactNameInput = document.getElementById('contact-name');
    const contactPhoneInput = document.getElementById('contact-phone');
    const contactTelegramInput = document.getElementById('contact-telegram');
    const contactRelSelect = document.getElementById('contact-relationship');
    const btnSaveContact = document.getElementById('btn-save-contact');

    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    function openContactsModal() {
        if (contactsModal) {
            contactsModal.classList.remove('hidden');
            loadContacts();
        }
    }

    function closeContactsModal() {
        if (contactsModal) {
            contactsModal.classList.add('hidden');
        }
    }

    async function loadContacts() {
        if (!contactsList) return;

        try {
            const response = await fetch('/api/contacts');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const contacts = await response.json();

            if (contactsCount) {
                contactsCount.innerText = contacts.length;
            }

            contactsList.innerHTML = '';

            if (contacts.length === 0) {
                contactsList.innerHTML = `
                    <div class="contacts-empty">
                        <div class="contacts-empty-icon">🛡️</div>
                        <p><strong>No emergency contacts saved yet.</strong></p>
                        <p style="margin-top: 4px; font-size: 0.78rem; opacity: 0.75;">
                            Add your trusted contacts below to automatically alert them via Telegram with your live location during an SOS.
                        </p>
                    </div>
                `;
                return;
            }

            contacts.forEach(contact => {
                const card = document.createElement('div');
                card.className = 'contact-card';

                const initial = contact.name ? contact.name.trim().charAt(0).toUpperCase() : '?';
                const hasTg = contact.telegram_chat_id && contact.telegram_chat_id.trim();
                const tgBadge = hasTg
                    ? `<span class="badge-tg" title="Telegram Chat ID: ${escapeHtml(contact.telegram_chat_id)}">✈️ ${escapeHtml(contact.telegram_chat_id)}</span>`
                    : `<span class="badge-no-tg">No Telegram</span>`;

                card.innerHTML = `
                    <div class="contact-left">
                        <div class="contact-avatar">${initial}</div>
                        <div class="contact-info">
                            <div class="contact-name-row">
                                <span class="contact-name">${escapeHtml(contact.name)}</span>
                                <span class="badge-rel">${escapeHtml(contact.relationship || 'Contact')}</span>
                            </div>
                            <div class="contact-details-row">
                                <a href="tel:${escapeHtml(contact.phone)}" class="contact-phone-link">📞 ${escapeHtml(contact.phone)}</a>
                                ${tgBadge}
                            </div>
                        </div>
                    </div>
                    <button class="btn-delete-contact" data-id="${contact.id}" title="Delete contact" aria-label="Delete contact">🗑</button>
                `;

                const btnDelete = card.querySelector('.btn-delete-contact');
                btnDelete.addEventListener('click', () => deleteContact(contact.id));

                contactsList.appendChild(card);
            });
        } catch (error) {
            console.error('Failed to load contacts:', error);
            contactsList.innerHTML = `
                <div class="contacts-empty" style="color: var(--accent-red);">
                    <p>Failed to load contacts. Please verify server connection.</p>
                </div>
            `;
        }
    }

    // Post-Save Success Modal Elements
    const successModal = document.getElementById('contact-success-modal');
    const successContactName = document.getElementById('success-contact-name');
    const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
    const btnShareTelegram = document.getElementById('btn-share-telegram');
    const btnCopyBotLink = document.getElementById('btn-copy-bot-link');
    const copyBotLabel = document.getElementById('copy-bot-label');
    const btnCloseSuccess = document.getElementById('btn-close-success');

    // ID Help Modal Elements
    const idHelpModal = document.getElementById('id-help-modal');
    const btnOpenIdHelp = document.getElementById('btn-open-id-help');
    const btnCloseIdHelp = document.getElementById('btn-close-id-help');
    const btnDismissIdHelp = document.getElementById('btn-dismiss-id-help');

    const BOT_URL = 'https://t.me/rakshasakhi_alert_bot';
    const BOT_INVITE_MSG = 'Hey! I added you as my emergency contact on RakshaSakhi. Please click this link and press Start so you can receive my SOS alerts: https://t.me/rakshasakhi_alert_bot';
    const TG_SHARE_TEXT = 'Hey! I added you as my emergency contact on RakshaSakhi. Please click Start to activate SOS alerts.';

    function showSuccessModal(contact) {
        if (!successModal) return;

        if (successContactName) {
            if (contact && contact.name) {
                successContactName.innerText = `Contact: ${contact.name} (${contact.phone})`;
            } else {
                successContactName.innerText = '';
            }
        }

        if (btnShareWhatsapp) {
            btnShareWhatsapp.href = `https://wa.me/?text=${encodeURIComponent(BOT_INVITE_MSG)}`;
        }

        if (btnShareTelegram) {
            btnShareTelegram.href = `https://t.me/share/url?url=${encodeURIComponent(BOT_URL)}&text=${encodeURIComponent(TG_SHARE_TEXT)}`;
        }

        if (copyBotLabel) {
            copyBotLabel.innerText = 'Copy Bot Link';
        }
        if (btnCopyBotLink) {
            btnCopyBotLink.classList.remove('copied');
        }

        successModal.classList.remove('hidden');
    }

    function closeSuccessModal() {
        if (successModal) {
            successModal.classList.add('hidden');
        }
    }

    function openIdHelpModal() {
        if (idHelpModal) {
            idHelpModal.classList.remove('hidden');
        }
    }

    function closeIdHelpModal() {
        if (idHelpModal) {
            idHelpModal.classList.add('hidden');
        }
    }

    async function handleCopyBotLink() {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(BOT_URL);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = BOT_URL;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            if (copyBotLabel) copyBotLabel.innerText = '✓ Link Copied!';
            if (btnCopyBotLink) btnCopyBotLink.classList.add('copied');

            setTimeout(() => {
                if (copyBotLabel) copyBotLabel.innerText = 'Copy Bot Link';
                if (btnCopyBotLink) btnCopyBotLink.classList.remove('copied');
            }, 2500);
        } catch (err) {
            console.error('Failed to copy bot link:', err);
            alert('Bot Link: ' + BOT_URL);
        }
    }

    async function handleAddContact(e) {
        e.preventDefault();
        const name = contactNameInput.value.trim();
        const phone = contactPhoneInput.value.trim();
        const telegramChatId = contactTelegramInput.value.trim();
        const relationship = contactRelSelect.value;

        if (!name || !phone || !telegramChatId) {
            alert('Please fill in Name, Phone Number, and Telegram Chat ID.');
            return;
        }

        btnSaveContact.disabled = true;
        btnSaveContact.innerText = 'Saving...';

        try {
            const payload = {
                name: name,
                phone: phone,
                telegram_chat_id: telegramChatId,
                relationship: relationship
            };

            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || `HTTP ${response.status}`);
            }

            const createdContact = await response.json();

            // Reset form inputs
            formAddContact.reset();
            contactRelSelect.value = 'Friend';

            // Refresh contacts list
            await loadContacts();

            // Open post-save shareable success popup
            showSuccessModal(createdContact);
        } catch (error) {
            console.error('Failed to add contact:', error);
            alert(`Could not save contact: ${error.message}`);
        } finally {
            btnSaveContact.disabled = false;
            btnSaveContact.innerHTML = '<span>+ Add Emergency Contact</span>';
        }
    }

    async function deleteContact(contactId) {
        if (!confirm('Are you sure you want to remove this emergency contact?')) {
            return;
        }

        try {
            const response = await fetch(`/api/contacts/${contactId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || `HTTP ${response.status}`);
            }

            await loadContacts();
        } catch (error) {
            console.error(`Failed to delete contact ${contactId}:`, error);
            alert(`Could not delete contact: ${error.message}`);
        }
    }

    // Modal Event Listeners
    if (btnMenu) {
        btnMenu.addEventListener('click', openContactsModal);
        btnMenu.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openContactsModal();
            }
        });
    }

    if (btnCloseContacts) {
        btnCloseContacts.addEventListener('click', closeContactsModal);
    }

    if (contactsModal) {
        contactsModal.addEventListener('click', (e) => {
            if (e.target === contactsModal) {
                closeContactsModal();
            }
        });
    }

    if (btnCopyBotLink) {
        btnCopyBotLink.addEventListener('click', handleCopyBotLink);
    }

    if (btnCloseSuccess) {
        btnCloseSuccess.addEventListener('click', closeSuccessModal);
    }

    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                closeSuccessModal();
            }
        });
    }

    // ID Help Modal Listeners
    if (btnOpenIdHelp) {
        btnOpenIdHelp.addEventListener('click', openIdHelpModal);
    }

    if (btnCloseIdHelp) {
        btnCloseIdHelp.addEventListener('click', closeIdHelpModal);
    }

    if (btnDismissIdHelp) {
        btnDismissIdHelp.addEventListener('click', closeIdHelpModal);
    }

    if (idHelpModal) {
        idHelpModal.addEventListener('click', (e) => {
            if (e.target === idHelpModal) {
                closeIdHelpModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (idHelpModal && !idHelpModal.classList.contains('hidden')) {
                closeIdHelpModal();
            } else if (successModal && !successModal.classList.contains('hidden')) {
                closeSuccessModal();
            } else if (contactsModal && !contactsModal.classList.contains('hidden')) {
                closeContactsModal();
            }
        }
    });

    if (formAddContact) {
        formAddContact.addEventListener('submit', handleAddContact);
    }

    // Pre-load contact count on initial launch
    loadContacts();
});


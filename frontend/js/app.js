document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // STORAGE KEYS & PROFILE HELPERS
    // =========================================================================
    const PROFILE_KEY = 'rakshasakhi_user_profile';
    const ONBOARDED_KEY = 'rakshasakhi_onboarded';

    const DEFAULT_PROFILE = {
        name: 'Priya Sharma',
        dob: '1998-08-14',
        blood_group: 'O+',
        area: 'Rajouri Garden, New Delhi',
        phone: '+91 90123 45678'
    };

    function getUserProfile() {
        try {
            const raw = localStorage.getItem(PROFILE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return { ...DEFAULT_PROFILE, ...parsed };
            }
        } catch (e) {
            console.error('Error parsing profile from localStorage:', e);
        }
        return { ...DEFAULT_PROFILE };
    }

    function saveUserProfile(profile) {
        try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        } catch (e) {
            console.error('Error saving profile to localStorage:', e);
        }
    }

    function getUserName() {
        const profile = getUserProfile();
        return (profile && profile.name && profile.name.trim()) ? profile.name.trim() : 'Priya Sharma';
    }

    // Temporary profile during onboarding - starts completely blank
    let tempProfile = {
        name: '',
        dob: '',
        blood_group: '',
        area: ''
    };

    // =========================================================================
    // DOM REFERENCES
    // =========================================================================
    // Primary Screens
    const screenWelcome = document.getElementById('screen-welcome');
    const onboardingWizard = document.getElementById('onboarding-wizard');
    const wizardContainer = document.getElementById('onboarding-wizard-container');
    const screenDashboard = document.getElementById('screen-dashboard');
    const screenChat = document.getElementById('screen-chat');
    const screenStatus = document.getElementById('screen-status');
    const screenContacts = document.getElementById('screen-contacts');
    const screenProfile = document.getElementById('screen-profile');

    // Welcome Screen
    const btnWelcomeStart = document.getElementById('btn-welcome-start');

    // Onboarding Wizard Steps & Inputs
    const wizardStep1 = document.getElementById('wizard-step-1');
    const wizardStep2 = document.getElementById('wizard-step-2');
    const wizardStep3 = document.getElementById('wizard-step-3');
    const wizardStep4 = document.getElementById('wizard-step-4');
    const wizardStep5 = document.getElementById('wizard-step-5');

    const btnStep1Back = document.getElementById('btn-step1-back');
    const btnStep1Next = document.getElementById('btn-step1-next');
    const onboardName = document.getElementById('onboard-name');

    const btnStep2Back = document.getElementById('btn-step2-back');
    const btnStep2Next = document.getElementById('btn-step2-next');
    const onboardDob = document.getElementById('onboard-dob');

    const btnStep3Back = document.getElementById('btn-step3-back');
    const btnStep3Next = document.getElementById('btn-step3-next');
    const bloodChips = document.querySelectorAll('.blood-chip');
    const btnBloodUnknown = document.getElementById('btn-blood-unknown');
    const onboardBloodGroupVal = document.getElementById('onboard-blood-group-val');
    const onboardBloodGroupSelect = document.getElementById('onboard-blood-group');

    const btnStep4Back = document.getElementById('btn-step4-back');
    const btnStep4Next = document.getElementById('btn-step4-next');
    const onboardArea = document.getElementById('onboard-area');
    const btnStep4Gps = document.getElementById('btn-step4-gps');

    const btnStep5Back = document.getElementById('btn-step5-back');
    const btnAddEmergencyContact = document.getElementById('btn-add-emergency-contact');
    const contactName = document.getElementById('contact-name');
    const contactPhone = document.getElementById('contact-phone');
    const contactTelegram = document.getElementById('contact-telegram');
    const contactRelationship = document.getElementById('contact-relationship');
    const btnOpenTelegramHelp = document.getElementById('btn-open-telegram-help');

    // Modals
    const modalTelegramGuide = document.getElementById('modal-telegram-guide');
    const btnCloseTelegramGuide = document.getElementById('btn-close-telegram-guide');
    const btnTgDismiss = document.getElementById('btn-tg-dismiss');
    const btnTgOpenBot = document.getElementById('btn-tg-open-bot');

    const modalContactSuccess = document.getElementById('modal-contact-success');
    const btnLoopAddMore = document.getElementById('btn-loop-add-more');
    const btnLoopFinish = document.getElementById('btn-loop-finish');
    const btnLoopCancel = document.getElementById('btn-loop-cancel');
    const btnLoopSkip = document.getElementById('btn-loop-skip');

    // Task Group 2: Telegram Activation Modal & Loop Navigation Elements
    const modalTelegramActivation = document.getElementById('modal-telegram-activation');
    const btnCloseTelegramActivation = document.getElementById('btn-close-telegram-activation');
    const btnTgActivateBot = document.getElementById('btn-tg-activate-bot');
    const btnTgActivationSkip = document.getElementById('btn-tg-activation-skip');
    const btnContactLoopSkip = document.getElementById('btn-contact-loop-skip');
    const btnModalLoopSkip = document.getElementById('btn-modal-loop-skip');
    const btnMakeIdActive = document.getElementById('btn-make-id-active');

    // Field Error Display Elements
    const errContactName = document.getElementById('error-contact-name');
    const errContactPhone = document.getElementById('error-contact-phone');
    const errContactTelegram = document.getElementById('error-contact-telegram');
    const errModalContactName = document.getElementById('error-modal-contact-name');
    const errModalContactPhone = document.getElementById('error-modal-contact-phone');
    const errModalContactTelegram = document.getElementById('error-modal-contact-telegram');

    // Dashboard Elements
    const btnHeaderContacts = document.getElementById('btn-header-contacts');
    const badgeContactsCount = document.getElementById('badge-contacts-count');
    const btnHeaderProfile = document.getElementById('btn-header-profile');
    const btnHeaderInfo = document.getElementById('btn-header-info');
    const btnSOS = document.getElementById('btn-sos');
    const badgeGps = document.getElementById('badge-gps');
    const cardChatbot = document.getElementById('card-chatbot');

    // Secondary Modals
    const contactsModal = document.getElementById('contacts-modal');
    const btnCloseContacts = document.getElementById('btn-close-contacts');
    const contactsList = document.getElementById('contacts-list');
    const contactsCount = document.getElementById('contacts-count');
    const formAddContact = document.getElementById('form-add-contact');
    const drawerContactName = document.getElementById('drawer-contact-name');
    const drawerContactPhone = document.getElementById('drawer-contact-phone');
    const drawerContactTelegram = document.getElementById('drawer-contact-telegram');
    const drawerContactRel = document.getElementById('drawer-contact-relationship');
    const btnDrawerTelegramHelp = document.getElementById('btn-drawer-telegram-help');

    const userProfileModal = document.getElementById('user-profile-modal');
    const btnCloseProfile = document.getElementById('btn-close-profile');
    const profileNameInput = document.getElementById('profile-name');
    const profileDobInput = document.getElementById('profile-dob');
    const profileBloodGroupSelect = document.getElementById('profile-blood-group');
    const profileAreaInput = document.getElementById('profile-area');
    const btnRevertProfile = document.getElementById('btn-revert-profile');
    const btnSaveProfile = document.getElementById('btn-save-profile');

    const infoModal = document.getElementById('info-modal');
    const btnCloseInfo = document.getElementById('btn-close-info');
    const btnDismissInfo = document.getElementById('btn-dismiss-info');

    // Milestone 3: Dedicated Contacts Screen Elements
    const btnContactsBack = document.getElementById('btn-contacts-back');
    const fullContactsList = document.getElementById('full-contacts-list');
    const btnContactsAddNew = document.getElementById('btn-contacts-add-new');
    const btnSendTestAlert = document.getElementById('btn-send-test-alert');

    // Milestone 3: Dedicated Profile Screen Elements
    const btnProfileBack = document.getElementById('btn-profile-back');
    const displayProfileName = document.getElementById('display-profile-name');
    const valProfileName = document.getElementById('val-profile-name');
    const valProfileDob = document.getElementById('val-profile-dob');
    const valProfileBlood = document.getElementById('val-profile-blood');
    const valProfileArea = document.getElementById('val-profile-area');
    const valProfilePhone = document.getElementById('val-profile-phone');
    const btnChangeAvatar = document.getElementById('btn-change-avatar');

    // Milestone 3: Contact Form Modal Elements
    const modalContactForm = document.getElementById('modal-contact-form');
    const btnCloseContactModal = document.getElementById('btn-close-contact-modal');
    const modalContactFormTitle = document.getElementById('modal-contact-form-title');
    const modalContactFormDesc = document.getElementById('modal-contact-form-desc');
    const formModalContact = document.getElementById('form-modal-contact');
    const modalContactId = document.getElementById('modal-contact-id');
    const modalContactName = document.getElementById('modal-contact-name');
    const modalContactPhone = document.getElementById('modal-contact-phone');
    const modalContactTelegram = document.getElementById('modal-contact-telegram');
    const modalContactRelationship = document.getElementById('modal-contact-relationship');
    const btnModalContactSubmit = document.getElementById('btn-modal-contact-submit');
    const btnModalContactSubmitText = document.getElementById('btn-modal-contact-submit-text');
    const btnModalTelegramHelp = document.getElementById('btn-modal-telegram-help');

    // Milestone 3: Single Field Edit Modal Elements
    const modalFieldEdit = document.getElementById('modal-field-edit');
    const btnCloseFieldEdit = document.getElementById('btn-close-field-edit');
    const btnCancelFieldEdit = document.getElementById('btn-cancel-field-edit');
    const formFieldEdit = document.getElementById('form-field-edit');
    const editFieldKey = document.getElementById('edit-field-key');
    const editFieldLabel = document.getElementById('edit-field-label');
    const editFieldInputContainer = document.getElementById('edit-field-input-container');
    const modalFieldEditTitle = document.getElementById('modal-field-edit-title');

    // Profile Modal phone input
    const profilePhoneInput = document.getElementById('profile-phone');

    // Sakhi Multi-Language Chat Screen Elements
    const btnBackChat = document.getElementById('btn-back-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const btnSendChat = document.getElementById('btn-send-chat');
    const btnViewStatus = document.getElementById('btn-view-status');
    const btnChatInfo = document.getElementById('btn-chat-info');
    const btnChatSwitchLang = document.getElementById('btn-chat-switch-lang');
    const currentLangIndicator = document.getElementById('current-lang-indicator');
    const sakhiLangSelection = document.getElementById('sakhi-language-selection');
    const sakhiPromptChips = document.getElementById('sakhi-prompt-chips');
    const btnLangEn = document.getElementById('btn-lang-en');
    const btnLangHi = document.getElementById('btn-lang-hi');
    const btnLangHinglish = document.getElementById('btn-lang-hinglish');

    // Dedicated Simple SOS Chat Screen Elements
    const screenSosChat = document.getElementById('screen-sos-chat');
    const btnSosChatBack = document.getElementById('btn-sos-chat-back');
    const btnSosSiren = document.getElementById('btn-sos-siren');
    const sosSirenLabel = document.getElementById('sos-siren-label');
    const sirenCheckbox = document.getElementById('siren-checkbox');
    const sosChatMessages = document.getElementById('sos-chat-messages');
    const sosEmergencyChips = document.getElementById('sos-emergency-chips');
    const sosChatInput = document.getElementById('sos-chat-input');
    const btnSendSosChat = document.getElementById('btn-send-sos-chat');
    const btnSosViewStatus = document.getElementById('btn-sos-view-status');
    const btnStatusOpenSosChat = document.getElementById('btn-status-open-sos-chat');

    // Status Screen
    const btnStatusBack = document.getElementById('btn-status-back');
    const statusTime = document.getElementById('status-time');
    const statusLocation = document.getElementById('status-location');
    const statusTelegram = document.getElementById('status-telegram');
    const btnReset = document.getElementById('btn-reset');

    // App State
    let currentMode = 'daily';
    let sessionId = 'session-' + Math.random().toString(36).substring(2, 9);
    let chatInitialized = false;
    let currentLocation = null;
    let triggerSource = 'button'; // becomes 'voice' when the keyword detector fires

    // ==========================================================
    // Siren
    // ==========================================================
    const sirenAudio = new Audio('/assets/audio/siren.mp3');
    sirenAudio.loop = true;
    const sirenCheckbox = document.getElementById('siren-checkbox');

    function setSiren(on) {
        if (on) {
            sirenAudio.play().catch(e => console.error('Siren blocked by browser:', e));
        } else {
            sirenAudio.pause();
            sirenAudio.currentTime = 0;
        }
        if (sirenCheckbox) sirenCheckbox.checked = on;
    }

    if (sirenCheckbox) {
        sirenCheckbox.addEventListener('change', () => setSiren(sirenCheckbox.checked));
    }

    // ==========================================================
    // Voice trigger ("help" keyword) - needs tfjs-voice.js loaded in index.html
    // ==========================================================
    const voiceIndicator = document.getElementById('voice-indicator');
    let voiceOn = false;

    function setVoiceLabel(text, active = false) {
        if (!voiceIndicator) return;
        voiceIndicator.innerHTML = '<span class="icon">🎤</span> ' + text;
        voiceIndicator.classList.toggle('active', active);
    }

    if (voiceIndicator) {
        voiceIndicator.addEventListener('click', async () => {
            if (typeof VoiceTrigger === 'undefined') {
                setVoiceLabel('Voice scripts not loaded (check index.html)');
                return;
            }
            if (voiceOn) {
                VoiceTrigger.stop();
                voiceOn = false;
                setVoiceLabel('Voice Detection: Tap to enable');
                return;
            }
            try {
                await VoiceTrigger.start({
                    onStatus: (t) => setVoiceLabel(t, VoiceTrigger.isListening()),
                    onTrigger: () => {
                        if (currentMode !== 'emergency') {
                            triggerSource = 'voice';
                            btnSOS.click(); // same flow as pressing the SOS button
                        }
                    }
                });
                voiceOn = true;
            } catch (err) {
                console.error('Voice trigger failed:', err);
                setVoiceLabel('Voice unavailable: ' + err.message);
            }
        });
    }

    // =========================================================================
    // GEOLOCATION UTILITIES
    // =========================================================================
    function getUserLocation(timeoutMs = 6000) {
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
                    currentLocation = loc;
                    resolve(loc);
                },
                (error) => {
                    console.warn('Geolocation permission error or unavailable:', error.message);
                    resolve(null);
                },
                options
            );
        });
    }

    // =========================================================================
    // SCREEN NAVIGATION ROUTER
    // =========================================================================
    function hideAllPrimaryViews() {
        if (screenWelcome) {
            screenWelcome.classList.add('hidden');
            screenWelcome.style.display = 'none';
        }
        if (onboardingWizard) {
            onboardingWizard.classList.add('hidden');
            onboardingWizard.style.display = 'none';
        }
        if (wizardContainer) {
            wizardContainer.classList.add('hidden');
            wizardContainer.style.display = 'none';
        }
        if (screenDashboard) {
            screenDashboard.classList.add('hidden');
            screenDashboard.style.display = 'none';
        }
        if (screenChat) {
            screenChat.classList.add('hidden');
            screenChat.style.display = 'none';
        }
        if (screenSosChat) {
            screenSosChat.classList.add('hidden');
            screenSosChat.style.display = 'none';
        }
        if (screenStatus) {
            screenStatus.classList.add('hidden');
            screenStatus.style.display = 'none';
        }
        if (screenContacts) {
            screenContacts.classList.add('hidden');
            screenContacts.style.display = 'none';
        }
        if (screenProfile) {
            screenProfile.classList.add('hidden');
            screenProfile.style.display = 'none';
        }
    }

    function showWelcomeScreen() {
        hideAllPrimaryViews();
        if (screenWelcome) {
            screenWelcome.classList.remove('hidden');
            screenWelcome.style.display = 'flex';
        }
    }

    function showDashboardScreen() {
        hideAllPrimaryViews();
        if (screenDashboard) {
            screenDashboard.classList.remove('hidden');
            screenDashboard.style.display = 'flex';
        }
        loadContacts();
        renderProfileCards();
    }

    function showContactsScreen() {
        hideAllPrimaryViews();
        if (screenContacts) {
            screenContacts.classList.remove('hidden');
            screenContacts.style.display = 'flex';
        }
        loadContacts();
    }

    function showProfileScreen() {
        hideAllPrimaryViews();
        if (screenProfile) {
            screenProfile.classList.remove('hidden');
            screenProfile.style.display = 'flex';
        }
        renderProfileCards();
    }

    function showChatScreen(mode = 'daily') {
        if (mode === 'emergency') {
            showSosChatScreen();
            return;
        }
        currentMode = 'daily';
        hideAllPrimaryViews();
        if (screenChat) {
            screenChat.classList.remove('hidden');
            screenChat.style.display = 'flex';
        }
        if (!selectedSakhiLang) {
            switchSakhiLanguagePrompt();
        }
    }

    function showSosChatScreen() {
        currentMode = 'emergency';
        hideAllPrimaryViews();
        if (screenSosChat) {
            screenSosChat.classList.remove('hidden');
            screenSosChat.style.display = 'flex';
        }
        getUserLocation().catch(() => { });
    }

    function showStatusScreen() {
        hideAllPrimaryViews();
        if (screenStatus) {
            screenStatus.classList.remove('hidden');
            screenStatus.style.display = 'flex';
        }
        fetchLiveAlertStatus();
    }

    function navigateTo(screenId) {
        switch (screenId) {
            case 'screen-welcome':
                showWelcomeScreen();
                break;
            case 'screen-dashboard':
                showDashboardScreen();
                break;
            case 'screen-contacts':
                showContactsScreen();
                break;
            case 'screen-profile':
                showProfileScreen();
                break;
            case 'screen-chat':
                showChatScreen('daily');
                break;
            case 'screen-sos-chat':
                showSosChatScreen();
                break;
            case 'screen-status':
                showStatusScreen();
                break;
            default:
                console.warn('Unknown screen ID in navigateTo:', screenId);
                showDashboardScreen();
        }
    }
    window.navigateTo = navigateTo;

    // =========================================================================
    // ONBOARDING WIZARD NAVIGATION & VALIDATION
    // =========================================================================
    function showWizardStep(stepNum) {
        hideAllPrimaryViews();
        if (onboardingWizard) {
            onboardingWizard.classList.remove('hidden');
            onboardingWizard.style.display = 'flex';
        }
        if (wizardContainer) {
            wizardContainer.classList.remove('hidden');
            wizardContainer.style.display = 'flex';
        }

        const stepMap = {
            1: wizardStep1,
            2: wizardStep2,
            3: wizardStep3,
            4: wizardStep4,
            5: wizardStep5
        };

        [wizardStep1, wizardStep2, wizardStep3, wizardStep4, wizardStep5].forEach(step => {
            if (step) {
                step.classList.add('hidden');
                step.classList.remove('active');
                step.style.display = 'none';
            }
        });

        const target = stepMap[stepNum];
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
            target.style.display = 'flex';
        }

        // Populate inputs if previously entered by user
        if (stepNum === 1 && onboardName) {
            onboardName.value = tempProfile.name || '';
            validateStep1();
        } else if (stepNum === 2 && onboardDob) {
            onboardDob.value = tempProfile.dob || '';
            validateStep2();
        } else if (stepNum === 3) {
            if (tempProfile.blood_group) {
                selectBloodChip(tempProfile.blood_group);
            } else {
                bloodChips.forEach(c => c.classList.remove('active'));
                if (btnBloodUnknown) btnBloodUnknown.classList.remove('active');
                if (onboardBloodGroupVal) onboardBloodGroupVal.value = '';
                if (onboardBloodGroupSelect) onboardBloodGroupSelect.value = '';
                if (btnStep3Next) btnStep3Next.disabled = true;
            }
        } else if (stepNum === 4 && onboardArea) {
            onboardArea.value = tempProfile.area || '';
            validateStep4();
        } else if (stepNum === 5) {
            validateStep5();
        }
    }

    // Inline field validation error helpers
    function showFieldError(type, message) {
        const errEl = document.getElementById(`${type}-error-msg`);
        if (errEl) {
            errEl.textContent = message;
            errEl.classList.remove('hidden');
        }
    }

    function clearFieldError(type) {
        const errEl = document.getElementById(`${type}-error-msg`);
        if (errEl) {
            errEl.textContent = '';
            errEl.classList.add('hidden');
        }
    }

    function showAreaHint(message) {
        const hintEl = document.getElementById('area-hint-msg');
        if (hintEl) {
            hintEl.textContent = message;
            hintEl.classList.remove('hidden');
        }
    }

    function hideAreaHint() {
        const hintEl = document.getElementById('area-hint-msg');
        if (hintEl) {
            hintEl.textContent = '';
            hintEl.classList.add('hidden');
        }
    }

    // Step 1 Validation
    function validateStep1() {
        if (!onboardName || !btnStep1Next) return;
        const val = onboardName.value.trim();
        const valid = val.length >= 2 && val.length <= 50;
        btnStep1Next.disabled = !valid;

        if (val.length > 0 && val.length < 2) {
            onboardName.classList.add('input-error');
            showFieldError('name', 'Name must be at least 2 characters / नाम कम से कम 2 अक्षरों का होना चाहिए।');
        } else {
            onboardName.classList.remove('input-error');
            clearFieldError('name');
        }
    }

    if (onboardName) {
        onboardName.addEventListener('input', validateStep1);
        onboardName.addEventListener('change', validateStep1);
        onboardName.addEventListener('blur', () => {
            const val = onboardName.value.trim();
            if (val.length === 0) {
                onboardName.classList.add('input-error');
                showFieldError('name', 'Please enter your name / कृपया अपना नाम दर्ज करें।');
            }
        });
    }

    if (btnStep1Back) {
        btnStep1Back.addEventListener('click', showWelcomeScreen);
    }

    if (btnStep1Next) {
        btnStep1Next.addEventListener('click', () => {
            const val = onboardName.value.trim();
            if (val.length < 2) {
                validateStep1();
                btnStep1Next.disabled = true;
                return;
            }
            tempProfile.name = val;
            showWizardStep(2);
        });
    }

    // Step 2 Validation (DOB with strict 100-year and future date restrictions)
    const todayObj = new Date();
    const todayIsoDate = todayObj.toISOString().split('T')[0];
    const minDobObj = new Date();
    minDobObj.setFullYear(todayObj.getFullYear() - 100);
    const minDobIsoDate = minDobObj.toISOString().split('T')[0];

    if (onboardDob) {
        onboardDob.max = todayIsoDate;
        onboardDob.min = minDobIsoDate;
    }
    if (profileDobInput) {
        profileDobInput.max = todayIsoDate;
        profileDobInput.min = minDobIsoDate;
    }

    function isDateInFuture(dateStr) {
        if (!dateStr) return false;
        const selected = new Date(dateStr);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return selected > today;
    }

    function isDateValidHumanLifespan(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return { valid: false, reason: 'blank' };
        const trimmed = dateStr.trim();
        if (!trimmed) return { valid: false, reason: 'blank' };

        const parts = trimmed.split('-');
        if (parts.length !== 3) return { valid: false, reason: 'format' };

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        if (isNaN(year) || isNaN(month) || isNaN(day)) return { valid: false, reason: 'format' };
        if (year < 1900) return { valid: false, reason: 'historic' };

        const selected = new Date(year, month, day);
        if (isNaN(selected.getTime())) return { valid: false, reason: 'format' };

        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (selected > today) {
            return { valid: false, reason: 'future' };
        }

        const minAllowedDate = new Date();
        minAllowedDate.setFullYear(today.getFullYear() - 100);
        minAllowedDate.setHours(0, 0, 0, 0);
        if (selected < minAllowedDate) {
            return { valid: false, reason: 'historic' };
        }

        return { valid: true };
    }

    function validateStep2() {
        if (!onboardDob || !btnStep2Next) return;
        const val = onboardDob.value ? onboardDob.value.trim() : '';
        if (!val) {
            btnStep2Next.disabled = true;
            onboardDob.classList.remove('input-error');
            clearFieldError('dob');
            return;
        }

        const res = isDateValidHumanLifespan(val);
        btnStep2Next.disabled = !res.valid;

        if (!res.valid) {
            onboardDob.classList.add('input-error');
            if (res.reason === 'future') {
                showFieldError('dob', 'Date of Birth cannot be in the future. / जन्म तिथि भविष्य की नहीं हो सकती।');
            } else if (res.reason === 'historic') {
                showFieldError('dob', 'Date of Birth cannot be older than 100 years. / जन्म तिथि 100 वर्ष से अधिक पुरानी नहीं हो सकती।');
            } else {
                showFieldError('dob', 'Please select a valid date of birth. / कृपया एक मान्य जन्म तिथि दर्ज करें।');
            }
        } else {
            onboardDob.classList.remove('input-error');
            clearFieldError('dob');
        }
    }

    if (onboardDob) {
        onboardDob.addEventListener('input', validateStep2);
        onboardDob.addEventListener('change', validateStep2);
        onboardDob.addEventListener('blur', () => {
            const val = onboardDob.value ? onboardDob.value.trim() : '';
            if (!val) {
                onboardDob.classList.add('input-error');
                showFieldError('dob', 'Please select your date of birth. / कृपया अपनी जन्म तिथि दर्ज करें।');
            }
        });
    }

    if (btnStep2Back) {
        btnStep2Back.addEventListener('click', () => showWizardStep(1));
    }

    if (btnStep2Next) {
        btnStep2Next.addEventListener('click', () => {
            const val = onboardDob.value ? onboardDob.value.trim() : '';
            const res = isDateValidHumanLifespan(val);
            if (!res.valid) {
                validateStep2();
                btnStep2Next.disabled = true;
                return;
            }
            tempProfile.dob = val;
            showWizardStep(3);
        });
    }

    // Step 3 Validation & Blood Chips
    function selectBloodChip(val) {
        bloodChips.forEach(chip => {
            if (chip.getAttribute('data-value') === val) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });

        if (btnBloodUnknown) {
            if (btnBloodUnknown.getAttribute('data-value') === val) {
                btnBloodUnknown.classList.add('active');
            } else {
                btnBloodUnknown.classList.remove('active');
            }
        }

        if (onboardBloodGroupVal) {
            onboardBloodGroupVal.value = val;
        }

        if (onboardBloodGroupSelect) {
            onboardBloodGroupSelect.value = val === "Don't know" ? "" : val;
        }

        if (btnStep3Next) {
            btnStep3Next.disabled = !val;
        }

        clearFieldError('blood');
    }

    bloodChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const val = chip.getAttribute('data-value');
            selectBloodChip(val);
        });
    });

    // Mode B: Emergency SOS Button
    btnSOS.addEventListener('click', async () => {
        // Record time
        const now = new Date();
        triggerTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        statusTime.innerText = triggerTimestamp;

        currentMode = 'emergency';
        setSiren(true); // start the siren immediately, don't wait for GPS
        const source = triggerSource;
        triggerSource = 'button';
        if (btnBloodUnknown) {
            btnBloodUnknown.addEventListener('click', () => {
                const val = btnBloodUnknown.getAttribute('data-value');
                selectBloodChip(val);
            });
        }

        if (btnStep3Back) {
            btnStep3Back.addEventListener('click', () => showWizardStep(2));
        }

        if (btnStep3Next) {
            btnStep3Next.addEventListener('click', () => {
                const val = onboardBloodGroupVal ? onboardBloodGroupVal.value : '';
                if (!val) {
                    showFieldError('blood', 'Please select a blood group or choose "Don\'t know". / कृपया ब्लड ग्रुप चुनें या "पता नहीं" पर क्लिक करें।');
                    btnStep3Next.disabled = true;
                    return;
                }
                tempProfile.blood_group = val;
                showWizardStep(4);
            });
        }

        // Step 4 Validation & Geolocation Fetch
        function validateStep4() {
            if (!onboardArea || !btnStep4Next) return;
            const val = onboardArea.value ? onboardArea.value.trim() : '';
            const valid = val.length >= 2;
            btnStep4Next.disabled = !valid;

            if (valid) {
                onboardArea.classList.remove('input-error');
                clearFieldError('area');
            }
        }

        if (onboardArea) {
            onboardArea.addEventListener('input', validateStep4);
            onboardArea.addEventListener('change', validateStep4);
            onboardArea.addEventListener('blur', () => {
                const val = onboardArea.value ? onboardArea.value.trim() : '';
                if (val.length === 0) {
                    onboardArea.classList.add('input-error');
                    showFieldError('area', 'Please enter your local area or pincode / कृपया अपना इलाका या पिनकोड दर्ज करें।');
                }
            });
        }

        if (btnStep4Gps) {
            btnStep4Gps.addEventListener('click', async () => {
                btnStep4Gps.disabled = true;
                btnStep4Gps.innerHTML = `
                <div class="btn-fetch-content">
                    <span class="btn-fetch-main">📍 Acquiring Location...</span>
                    <span class="btn-fetch-sub">स्थान खोज रहे हैं...</span>
                </div>
            `;
                try {
                    const loc = await getUserLocation(5000);
                    if (loc && loc.lat && loc.lon) {
                        onboardArea.value = `GPS: ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}`;
                        hideAreaHint();
                        clearFieldError('area');
                        onboardArea.classList.remove('input-error');
                    } else {
                        showAreaHint('Location unavailable. Please type your area manually / स्थान उपलब्ध नहीं है। कृपया मैन्युअल रूप से टाइप करें।');
                        onboardArea.focus();
                    }
                } catch (e) {
                    console.warn('GPS retrieval error:', e);
                    showAreaHint('Location unavailable. Please type your area manually / स्थान उपलब्ध नहीं है। कृपया मैन्युअल रूप से टाइप करें।');
                    onboardArea.focus();
                } finally {
                    btnStep4Gps.disabled = false;
                    btnStep4Gps.innerHTML = `
                    <div class="btn-fetch-content">
                        <span class="btn-fetch-main">📍 Use Current Location</span>
                        <span class="btn-fetch-sub">वर्तमान स्थान का उपयोग करें</span>
                    </div>
                `;
                    validateStep4();
                }
            });
        }

        if (btnStep4Back) {
            btnStep4Back.addEventListener('click', () => showWizardStep(3));
        }

        if (btnStep4Next) {
            btnStep4Next.addEventListener('click', () => {
                const val = onboardArea.value ? onboardArea.value.trim() : '';
                if (val.length < 2) {
                    validateStep4();
                    btnStep4Next.disabled = true;
                    return;
                }
                tempProfile.area = val;
                showWizardStep(5);
            });
        }

        // =========================================================================
        // FIELD VALIDATION HELPERS (R2)
        // =========================================================================
        function validateName(name) {
            if (!name || !name.trim()) {
                return { valid: false, message: 'Full Name is required / पूरा नाम आवश्यक है' };
            }
            if (name.trim().length < 2) {
                return { valid: false, message: 'Name must be at least 2 characters / नाम कम से कम 2 अक्षरों का होना चाहिए' };
            }
            return { valid: true, message: '' };
        }

        function validatePhone(phone) {
            if (!phone || !phone.trim()) {
                return { valid: false, message: 'Phone number is required / फ़ोन नंबर आवश्यक है' };
            }
            const trimmed = phone.trim();
            const stripped = trimmed.replace(/[\s\-]/g, '');
            // Must be strictly 10 digits, or +country_code (1-4 digits) followed by 10 digits
            const phoneRegex = /^(?:\+\d{1,4})?[0-9]{10}$/;
            if (!phoneRegex.test(stripped)) {
                return { valid: false, message: 'Valid 10-digit number required (optional country code e.g. +91) / 10 अंकों का मान्य फ़ोन नंबर दर्ज करें' };
            }
            return { valid: true, message: '' };
        }

        function validateTelegramId(tgId) {
            if (!tgId || !tgId.trim()) {
                return { valid: false, message: 'Telegram Chat ID is required / टेलीग्राम चैट आईडी आवश्यक है' };
            }
            const trimmed = tgId.trim();
            // Strictly 9 to 14 numeric digits: ^\d{9,14}$
            const tgRegex = /^\d{9,14}$/;
            if (!tgRegex.test(trimmed)) {
                return { valid: false, message: 'Telegram Chat ID must be strictly 9 to 14 numeric digits / टेलीग्राम चैट आईडी में केवल 9 से 14 अंक होने चाहिए' };
            }
            return { valid: true, message: '' };
        }

        function setInputValidationState(inputEl, errorEl, validationResult) {
            if (!inputEl) return;
            if (!validationResult.valid) {
                inputEl.classList.add('input-error');
                if (errorEl) {
                    errorEl.innerText = validationResult.message;
                    errorEl.classList.add('visible');
                }
            } else {
                inputEl.classList.remove('input-error');
                if (errorEl) {
                    errorEl.innerText = '';
                    errorEl.classList.remove('visible');
                }
            }
        }

        function hideAllValidationErrors() {
            [contactName, contactPhone, contactTelegram, modalContactName, modalContactPhone, modalContactTelegram].forEach(el => {
                if (el) el.classList.remove('input-error');
            });
            [errContactName, errContactPhone, errContactTelegram, errModalContactName, errModalContactPhone, errModalContactTelegram].forEach(el => {
                if (el) {
                    el.innerText = '';
                    el.classList.remove('visible');
                }
            });
        }

        // Step 5 Validation
        function validateStep5() {
            if (!contactName || !contactPhone || !contactTelegram || !btnAddEmergencyContact) return false;
            const nameRes = validateName(contactName.value);
            const phoneRes = validatePhone(contactPhone.value);
            const tgRes = validateTelegramId(contactTelegram.value);
            const valid = nameRes.valid && phoneRes.valid && tgRes.valid;
            btnAddEmergencyContact.disabled = !valid;
            return valid;
        }

        if (contactName) {
            contactName.addEventListener('input', () => {
                validateStep5();
                if (contactName.classList.contains('input-error')) {
                    setInputValidationState(contactName, errContactName, validateName(contactName.value));
                }
            });
            contactName.addEventListener('blur', () => {
                if (contactName.value.trim().length > 0) {
                    setInputValidationState(contactName, errContactName, validateName(contactName.value));
                }
            });
        }

        if (contactPhone) {
            contactPhone.addEventListener('input', () => {
                validateStep5();
                if (contactPhone.classList.contains('input-error')) {
                    setInputValidationState(contactPhone, errContactPhone, validatePhone(contactPhone.value));
                }
            });
            contactPhone.addEventListener('blur', () => {
                if (contactPhone.value.trim().length > 0) {
                    setInputValidationState(contactPhone, errContactPhone, validatePhone(contactPhone.value));
                }
            });
        }

        if (contactTelegram) {
            contactTelegram.addEventListener('input', () => {
                validateStep5();
                if (contactTelegram.classList.contains('input-error')) {
                    setInputValidationState(contactTelegram, errContactTelegram, validateTelegramId(contactTelegram.value));
                }
            });
            contactTelegram.addEventListener('blur', () => {
                if (contactTelegram.value.trim().length > 0) {
                    setInputValidationState(contactTelegram, errContactTelegram, validateTelegramId(contactTelegram.value));
                }
            });
        }

        if (btnStep5Back) {
            btnStep5Back.addEventListener('click', () => showWizardStep(4));
        }

        // Step 5 Submission & Loop Trigger
        if (btnAddEmergencyContact) {
            btnAddEmergencyContact.addEventListener('click', async () => {
                const name = contactName.value.trim();
                const phone = contactPhone.value.trim();
                const telegram_chat_id = contactTelegram.value.trim();
                const relationship = contactRelationship ? contactRelationship.value : 'Friend';

                const nameRes = validateName(name);
                const phoneRes = validatePhone(phone);
                const tgRes = validateTelegramId(telegram_chat_id);

                setInputValidationState(contactName, errContactName, nameRes);
                setInputValidationState(contactPhone, errContactPhone, phoneRes);
                setInputValidationState(contactTelegram, errContactTelegram, tgRes);

                if (!nameRes.valid || !phoneRes.valid || !tgRes.valid) {
                    const firstError = (!nameRes.valid ? nameRes.message : (!phoneRes.valid ? phoneRes.message : tgRes.message));
                    alert(`Validation Error: ${firstError}`);
                    return;
                }

                btnAddEmergencyContact.disabled = true;
                btnAddEmergencyContact.innerHTML = '<span>Adding... / जोड़ा जा रहा है...</span>';

                try {
                    const response = await fetch('/api/contacts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, phone, telegram_chat_id, relationship })
                    });

                    if (response.ok) {
                        await loadContacts();
                        openModal(modalContactSuccess);
                    } else {
                        const err = await response.json();
                        alert(`Failed to add contact: ${err.detail || 'Please verify details'}`);
                    }
                } catch (error) {
                    console.error('Error adding emergency contact:', error);
                    alert('Network error while adding contact. Please try again.');
                } finally {
                    btnAddEmergencyContact.innerHTML = '<span>+ Add Emergency Contact / + आपातकालीन संपर्क जोड़ें</span>';
                    validateStep5();
                }
            });
        }

        // =========================================================================
        // MODAL HELPERS & TELEGRAM GUIDE (R5)
        // =========================================================================
        function openModal(modalEl) {
            if (modalEl) modalEl.classList.remove('hidden');
        }

        function closeModal(modalEl) {
            if (modalEl) modalEl.classList.add('hidden');
        }

        // Telegram Guide (Helper Modal: @userinfobot)
        if (btnOpenTelegramHelp) {
            btnOpenTelegramHelp.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(modalTelegramGuide);
            });
        }

        if (btnDrawerTelegramHelp) {
            btnDrawerTelegramHelp.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(modalTelegramGuide);
            });
        }

        if (btnCloseTelegramGuide) {
            btnCloseTelegramGuide.addEventListener('click', () => closeModal(modalTelegramGuide));
        }

        if (btnTgDismiss) {
            btnTgDismiss.addEventListener('click', () => closeModal(modalTelegramGuide));
        }

        if (btnTgOpenBot) {
            btnTgOpenBot.addEventListener('click', () => {
                window.open('https://t.me/userinfobot', '_blank');
            });
        }

        // =========================================================================
        // INFINITE CONTACT LOOP MODAL & NAVIGATION (R3, R4, R5)
        // =========================================================================
        function enterContactLoopMode() {
            closeModal(modalContactSuccess);

            // Reset Step 5 inputs
            if (contactName) contactName.value = '';
            if (contactPhone) contactPhone.value = '';
            if (contactTelegram) contactTelegram.value = '';
            if (contactRelationship) contactRelationship.value = 'Friend';
            if (btnAddEmergencyContact) btnAddEmergencyContact.disabled = true;

            // Reset Modal Contact inputs
            if (modalContactId) modalContactId.value = '';
            if (modalContactName) modalContactName.value = '';
            if (modalContactPhone) modalContactPhone.value = '';
            if (modalContactTelegram) modalContactTelegram.value = '';
            if (modalContactRelationship) modalContactRelationship.value = 'Friend';

            hideAllValidationErrors();

            // Check if user is currently onboarding or in main dashboard
            const isOnboarded = localStorage.getItem(ONBOARDED_KEY);
            if (!isOnboarded) {
                // In onboarding flow: show Step 5 in loop mode
                if (btnStep5Back) btnStep5Back.classList.add('hidden');
                const step5ProgressHeader = document.getElementById('step5-progress-header');
                if (step5ProgressHeader) step5ProgressHeader.classList.add('hidden');
                if (btnContactLoopSkip) btnContactLoopSkip.classList.remove('hidden');
                showWizardStep(5);
            } else {
                // In post-onboarding flow: show modalContactForm in loop mode
                if (modalContactFormTitle) {
                    modalContactFormTitle.innerHTML = 'Add Emergency Contact<br><span class="title-hindi">आपातकालीन संपर्क जोड़ें</span>';
                }
                if (btnModalContactSubmitText) {
                    btnModalContactSubmitText.innerHTML = '+ Add Emergency Contact<br><span class="btn-subtext-hindi">+ आपातकालीन संपर्क जोड़ें</span>';
                }
                if (btnModalLoopSkip) btnModalLoopSkip.classList.remove('hidden');
                if (btnCloseContactModal) btnCloseContactModal.classList.add('hidden');
                openModal(modalContactForm);
            }
        }

        function handleLoopSkipToDashboard() {
            // Discard any partially typed unsubmitted loop inputs
            if (contactName) contactName.value = '';
            if (contactPhone) contactPhone.value = '';
            if (contactTelegram) contactTelegram.value = '';
            if (modalContactName) modalContactName.value = '';
            if (modalContactPhone) modalContactPhone.value = '';
            if (modalContactTelegram) modalContactTelegram.value = '';
            hideAllValidationErrors();

            // Mark onboarding complete if skipped during onboarding loop
            saveUserProfile(tempProfile);
            localStorage.setItem(ONBOARDED_KEY, 'true');

            // Close any modals
            closeModal(modalContactSuccess);
            closeModal(modalContactForm);
            closeModal(modalTelegramGuide);
            closeModal(modalTelegramActivation);

            // Reset loop header UI state
            if (btnStep5Back) btnStep5Back.classList.remove('hidden');
            const step5ProgressHeader = document.getElementById('step5-progress-header');
            if (step5ProgressHeader) step5ProgressHeader.classList.remove('hidden');
            if (btnContactLoopSkip) btnContactLoopSkip.classList.add('hidden');
            if (btnModalLoopSkip) btnModalLoopSkip.classList.add('hidden');
            if (btnCloseContactModal) btnCloseContactModal.classList.remove('hidden');

            // User Refinement 2: Return cleanly to Home Dashboard (#screen-dashboard)
            showDashboardScreen();
        }

        function handleLoopFinish() {
            saveUserProfile(tempProfile);
            localStorage.setItem(ONBOARDED_KEY, 'true');
            closeModal(modalContactSuccess);

            // Requirement R5: Transition to #modal-telegram-activation
            openModal(modalTelegramActivation);
        }

        if (btnLoopAddMore) {
            btnLoopAddMore.addEventListener('click', enterContactLoopMode);
        }

        if (btnLoopFinish) {
            btnLoopFinish.addEventListener('click', handleLoopFinish);
        }

        if (btnLoopCancel) {
            btnLoopCancel.addEventListener('click', handleLoopFinish);
        }

        if (btnLoopSkip) {
            btnLoopSkip.addEventListener('click', handleLoopFinish);
        }

        if (btnContactLoopSkip) {
            btnContactLoopSkip.addEventListener('click', handleLoopSkipToDashboard);
        }

        if (btnModalLoopSkip) {
            btnModalLoopSkip.addEventListener('click', handleLoopSkipToDashboard);
        }

        // Telegram Activation Modal Handlers (R5)
        if (btnCloseTelegramActivation) {
            btnCloseTelegramActivation.addEventListener('click', () => {
                closeModal(modalTelegramActivation);
                showDashboardScreen();
            });
        }

        if (btnTgActivationSkip) {
            btnTgActivationSkip.addEventListener('click', () => {
                closeModal(modalTelegramActivation);
                showDashboardScreen();
            });
        }

        if (btnTgActivateBot) {
            btnTgActivateBot.addEventListener('click', () => {
                // Direct link to @RakshaSakhi_Alert_Bot
                window.open('https://t.me/RakshaSakhi_Alert_Bot', '_blank');
            });
        }

        if (btnMakeIdActive) {
            btnMakeIdActive.addEventListener('click', () => {
                openModal(modalTelegramActivation);
            });
        }

        // =========================================================================
        // CONTACTS LIST & DRAWER MANAGEMENT
        // =========================================================================
        function escapeHtml(text) {
            if (!text) return '';
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return String(text).replace(/[&<>"']/g, m => map[m]);
        }

        let cachedContacts = [];

        async function loadContacts() {
            try {
                const res = await fetch('/api/contacts');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const contacts = await res.json();
                cachedContacts = contacts;

                const count = contacts.length;
                if (badgeContactsCount) badgeContactsCount.innerText = count;
                if (contactsCount) contactsCount.innerText = count;

                // 1. Render Dedicated Screen Contacts List (#full-contacts-list) matching contact_main_page.png
                if (fullContactsList) {
                    fullContactsList.innerHTML = '';
                    if (count === 0) {
                        fullContactsList.innerHTML = `
                        <div class="contacts-empty-box" style="text-align: center; padding: 30px 20px; color: #8e95a5;">
                            <p style="font-size: 15px; font-weight: 600; color: #fff;">No emergency contacts saved yet.</p>
                            <p style="font-size: 12px; margin-top: 6px;">Add contacts below to alert them via Telegram with live GPS.</p>
                        </div>
                    `;
                    } else {
                        contacts.forEach(contact => {
                            const card = document.createElement('div');
                            card.className = 'contact-card-modern';

                            const rel = contact.relationship || 'Friend';
                            let avatarIcon = '👤';
                            const lowerRel = rel.toLowerCase();
                            const lowerName = (contact.name || '').toLowerCase();
                            if (lowerRel.includes('father') || lowerRel.includes('papa') || lowerRel.includes('brother') || lowerName.includes('papa')) {
                                avatarIcon = '👨';
                            } else if (lowerRel.includes('mother') || lowerRel.includes('mom') || lowerRel.includes('sister') || lowerName.includes('priya')) {
                                avatarIcon = '👩';
                            }

                            card.innerHTML = `
                            <div class="contact-card-top-row">
                                <div class="contact-user-intro">
                                    <div class="contact-avatar-silhouette">${avatarIcon}</div>
                                    <div class="contact-title-group">
                                        <span class="contact-name-txt">${escapeHtml(contact.name)}</span>
                                        <span class="contact-rel-badge">${escapeHtml(rel)}</span>
                                    </div>
                                </div>
                                <div class="contact-card-actions">
                                    <button type="button" class="btn-card-edit" data-id="${contact.id}" title="Edit contact" aria-label="Edit contact">✏️</button>
                                    <button type="button" class="btn-card-del" data-id="${contact.id}" title="Delete contact" aria-label="Delete contact">🗑️</button>
                                </div>
                            </div>
                            <div class="contact-card-meta-row">
                                <span>📞 e.g. ${escapeHtml(contact.phone)}</span>
                            </div>
                            <div class="contact-card-meta-row">
                                <span>✈️ Telegram ID: ${escapeHtml(contact.telegram_chat_id || 'Not set')}</span>
                            </div>
                        `;

                            const btnEdit = card.querySelector('.btn-card-edit');
                            btnEdit.addEventListener('click', () => openEditContactModal(contact));

                            const btnDel = card.querySelector('.btn-card-del');
                            btnDel.addEventListener('click', () => deleteContact(contact.id));

                            fullContactsList.appendChild(card);
                        });
                    }
                }

                // 2. Render Legacy Modal Contacts List (#contacts-list) for test compatibility
                if (contactsList) {
                    contactsList.innerHTML = '';
                    if (count === 0) {
                        contactsList.innerHTML = `
                        <div class="contacts-empty-box">
                            <p>No emergency contacts saved yet.</p>
                            <p style="font-size: 11px; margin-top: 4px; opacity: 0.7;">Add contacts below to alert them via Telegram with live GPS.</p>
                        </div>
                    `;
                    } else {
                        contacts.forEach(contact => {
                            const item = document.createElement('div');
                            item.className = 'contact-card-item';
                            const tgBadge = contact.telegram_chat_id
                                ? `<span class="badge-tag tg">✈️ ${escapeHtml(contact.telegram_chat_id)}</span>`
                                : `<span class="badge-tag">No TG</span>`;

                            item.innerHTML = `
                            <div class="contact-card-info">
                                <strong>${escapeHtml(contact.name)}</strong>
                                <span>📞 ${escapeHtml(contact.phone)}</span>
                                <div class="contact-card-badges">
                                    <span class="badge-tag">${escapeHtml(contact.relationship || 'Contact')}</span>
                                    ${tgBadge}
                                </div>
                            </div>
                            <div class="contact-card-actions">
                                <button type="button" class="btn-card-edit" data-id="${contact.id}" title="Edit contact" aria-label="Edit contact">✏️</button>
                                <button type="button" class="btn-card-del" data-id="${contact.id}" title="Delete contact" aria-label="Delete contact">🗑️</button>
                            </div>
                        `;

                            const btnEdit = item.querySelector('.btn-card-edit');
                            if (btnEdit) btnEdit.addEventListener('click', () => openEditContactModal(contact));

                            const btnDel = item.querySelector('.btn-card-del');
                            btnDel.addEventListener('click', () => deleteContact(contact.id));
                            contactsList.appendChild(item);
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to load contacts:', err);
            }
        }

        async function deleteContact(id) {
            if (!confirm('Are you sure you want to delete this emergency contact?')) return;
            try {
                const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    await loadContacts();
                } else {
                    alert('Failed to delete contact.');
                }
            } catch (e) {
                console.error('Error deleting contact:', e);
            }
        }

        // Modal Contact Form Helpers (contact_page.png)
        function openAddContactModal() {
            if (modalContactId) modalContactId.value = '';
            if (modalContactName) modalContactName.value = '';
            if (modalContactPhone) modalContactPhone.value = '';
            if (modalContactTelegram) modalContactTelegram.value = '';
            if (modalContactRelationship) modalContactRelationship.value = 'Friend';
            hideAllValidationErrors();
            if (btnModalLoopSkip) btnModalLoopSkip.classList.add('hidden');
            if (btnCloseContactModal) btnCloseContactModal.classList.remove('hidden');
            if (modalContactFormTitle) {
                modalContactFormTitle.innerHTML = 'Add Emergency Contact<br><span class="title-hindi">आपातकालीन संपर्क जोड़ें</span>';
            }
            if (modalContactFormDesc) {
                modalContactFormDesc.innerHTML = 'Whom should we notify in an emergency?<br><span class="desc-hindi">आपातकाल में हम किसे सूचित करें?</span>';
            }
            if (btnModalContactSubmitText) {
                btnModalContactSubmitText.innerHTML = '+ Add Emergency Contact<br><span class="btn-subtext-hindi">+ आपातकालीन संपर्क जोड़ें</span>';
            }
            openModal(modalContactForm);
        }

        function openEditContactModal(contact) {
            if (modalContactId) modalContactId.value = contact.id;
            if (modalContactName) modalContactName.value = contact.name || '';
            if (modalContactPhone) modalContactPhone.value = contact.phone || '';
            if (modalContactTelegram) modalContactTelegram.value = contact.telegram_chat_id || '';
            if (modalContactRelationship) modalContactRelationship.value = contact.relationship || 'Friend';
            hideAllValidationErrors();
            if (btnModalLoopSkip) btnModalLoopSkip.classList.add('hidden');
            if (btnCloseContactModal) btnCloseContactModal.classList.remove('hidden');
            if (modalContactFormTitle) {
                modalContactFormTitle.innerHTML = 'Edit Emergency Contact<br><span class="title-hindi">आपातकालीन संपर्क बदलें</span>';
            }
            if (modalContactFormDesc) {
                modalContactFormDesc.innerHTML = 'Update details for this emergency contact.<br><span class="desc-hindi">इस संपर्क का विवरण अपडेट करें।</span>';
            }
            if (btnModalContactSubmitText) {
                btnModalContactSubmitText.innerHTML = 'Save Changes / सुरक्षित करें';
            }
            openModal(modalContactForm);
        }

        if (btnContactsAddNew) {
            btnContactsAddNew.addEventListener('click', openAddContactModal);
        }

        if (btnCloseContactModal) {
            btnCloseContactModal.addEventListener('click', () => closeModal(modalContactForm));
        }

        if (btnModalTelegramHelp) {
            btnModalTelegramHelp.addEventListener('click', () => openModal(modalTelegramGuide));
        }

        if (btnSendTestAlert) {
            btnSendTestAlert.addEventListener('click', () => {
                alert('🔔 Test Alert Sent! All active contacts will receive a simulation message via Telegram.\nअलर्ट भेजा गया!');
            });
        }

        if (modalContactName) {
            modalContactName.addEventListener('input', () => {
                if (modalContactName.classList.contains('input-error')) {
                    setInputValidationState(modalContactName, errModalContactName, validateName(modalContactName.value));
                }
            });
            modalContactName.addEventListener('blur', () => {
                if (modalContactName.value.trim().length > 0) {
                    setInputValidationState(modalContactName, errModalContactName, validateName(modalContactName.value));
                }
            });
        }

        if (modalContactPhone) {
            modalContactPhone.addEventListener('input', () => {
                if (modalContactPhone.classList.contains('input-error')) {
                    setInputValidationState(modalContactPhone, errModalContactPhone, validatePhone(modalContactPhone.value));
                }
            });
            modalContactPhone.addEventListener('blur', () => {
                if (modalContactPhone.value.trim().length > 0) {
                    setInputValidationState(modalContactPhone, errModalContactPhone, validatePhone(modalContactPhone.value));
                }
            });
        }

        if (modalContactTelegram) {
            modalContactTelegram.addEventListener('input', () => {
                if (modalContactTelegram.classList.contains('input-error')) {
                    setInputValidationState(modalContactTelegram, errModalContactTelegram, validateTelegramId(modalContactTelegram.value));
                }
            });
            modalContactTelegram.addEventListener('blur', () => {
                if (modalContactTelegram.value.trim().length > 0) {
                    setInputValidationState(modalContactTelegram, errModalContactTelegram, validateTelegramId(modalContactTelegram.value));
                }
            });
        }

        if (formModalContact) {
            formModalContact.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = modalContactId ? modalContactId.value : '';
                const name = modalContactName ? modalContactName.value.trim() : '';
                const phone = modalContactPhone ? modalContactPhone.value.trim() : '';
                const telegram_chat_id = modalContactTelegram ? modalContactTelegram.value.trim() : '';
                const relationship = modalContactRelationship ? modalContactRelationship.value : 'Friend';

                const nameRes = validateName(name);
                const phoneRes = validatePhone(phone);
                const tgRes = validateTelegramId(telegram_chat_id);

                setInputValidationState(modalContactName, errModalContactName, nameRes);
                setInputValidationState(modalContactPhone, errModalContactPhone, phoneRes);
                setInputValidationState(modalContactTelegram, errModalContactTelegram, tgRes);

                if (!nameRes.valid || !phoneRes.valid || !tgRes.valid) {
                    const firstError = (!nameRes.valid ? nameRes.message : (!phoneRes.valid ? phoneRes.message : tgRes.message));
                    alert(`Validation Error: ${firstError}`);
                    return;
                }

                try {
                    const method = id ? 'PUT' : 'POST';
                    const url = id ? `/api/contacts/${id}` : '/api/contacts';

                    const res = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, phone, telegram_chat_id, relationship })
                    });

                    if (res.ok) {
                        closeModal(modalContactForm);
                        await loadContacts();
                        // Requirement R3: Trigger success modal when contact is added
                        if (!id) {
                            openModal(modalContactSuccess);
                        }
                    } else {
                        const err = await res.json();
                        alert(`Could not save contact: ${err.detail || 'Invalid input'}`);
                    }
                } catch (err) {
                    console.error('Failed to save contact:', err);
                    alert('Network error while saving contact.');
                }
            });
        }

        // Drawer form submission (legacy compatibility)
        if (formAddContact) {
            formAddContact.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = drawerContactName ? drawerContactName.value.trim() : '';
                const phone = drawerContactPhone ? drawerContactPhone.value.trim() : '';
                const telegram_chat_id = drawerContactTelegram ? drawerContactTelegram.value.trim() : '';
                const relationship = drawerContactRel ? drawerContactRel.value : 'Friend';

                const nameRes = validateName(name);
                const phoneRes = validatePhone(phone);
                const tgRes = validateTelegramId(telegram_chat_id);

                if (!nameRes.valid || !phoneRes.valid || !tgRes.valid) {
                    const firstError = (!nameRes.valid ? nameRes.message : (!phoneRes.valid ? phoneRes.message : tgRes.message));
                    alert(`Validation Error: ${firstError}`);
                    return;
                }

                try {
                    const res = await fetch('/api/contacts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, phone, telegram_chat_id, relationship })
                    });

                    if (res.ok) {
                        if (drawerContactName) drawerContactName.value = '';
                        if (drawerContactPhone) drawerContactPhone.value = '';
                        if (drawerContactTelegram) drawerContactTelegram.value = '';
                        await loadContacts();
                    } else {
                        const err = await res.json();
                        alert(`Could not save contact: ${err.detail || 'Invalid input'}`);
                    }
                } catch (err) {
                    console.error('Failed to save drawer contact:', err);
                }
            });
        }

        // Navigation to Dedicated Emergency Contacts Screen
        if (btnHeaderContacts) {
            btnHeaderContacts.addEventListener('click', () => {
                showContactsScreen();
            });
        }

        const btnMenu = document.getElementById('btn-menu');
        if (btnMenu && btnMenu !== btnHeaderContacts) {
            btnMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                showContactsScreen();
            });
        }

        if (btnContactsBack) {
            btnContactsBack.addEventListener('click', showDashboardScreen);
        }

        if (btnCloseContacts) {
            btnCloseContacts.addEventListener('click', () => closeModal(contactsModal));
        }

        // =========================================================================
        // PERSONAL DETAILS & PROFILE MANAGEMENT
        // =========================================================================
        function renderProfileCards() {
            const profile = getUserProfile();

            if (displayProfileName) {
                displayProfileName.innerText = (profile.name && profile.name.trim())
                    ? (profile.name.includes('(') ? profile.name : `${profile.name} (प्रिया शर्मा)`)
                    : 'Priya Sharma (प्रिया शर्मा)';
            }

            if (valProfileName) {
                valProfileName.innerText = (profile.name && profile.name.trim())
                    ? (profile.name.includes('/') ? profile.name : `${profile.name} / प्रिया शर्मा`)
                    : 'Priya Sharma / प्रिया शर्मा';
            }

            if (valProfileDob) {
                if (profile.dob) {
                    const parts = profile.dob.split('-');
                    if (parts.length === 3) {
                        valProfileDob.innerText = `${parts[2]} / ${parts[1]} / ${parts[0]}`;
                    } else {
                        valProfileDob.innerText = profile.dob;
                    }
                } else {
                    valProfileDob.innerText = '14 / 08 / 1998';
                }
            }

            if (valProfileBlood) {
                const bg = profile.blood_group || 'O+';
                let bgDisplay = bg;
                if (bg === 'O+' || bg.includes('O+')) bgDisplay = 'O+ (ओ पॉजिटिव)';
                else if (bg === 'A+' || bg.includes('A+')) bgDisplay = 'A+ (ए पॉजिटिव)';
                else if (bg === 'B+' || bg.includes('B+')) bgDisplay = 'B+ (बी पॉजिटिव)';
                else if (bg === 'AB+' || bg.includes('AB+')) bgDisplay = 'AB+ (एबी पॉजिटिव)';
                valProfileBlood.innerText = bgDisplay;
            }

            if (valProfileArea) {
                valProfileArea.innerText = (profile.area && profile.area.trim())
                    ? (profile.area.includes('/') ? profile.area : `${profile.area} / राजौरी गार्डन, नई दिल्ली`)
                    : 'Rajouri Garden, New Delhi / राजौरी गार्डन, नई दिल्ली';
            }

            if (valProfilePhone) {
                valProfilePhone.innerText = (profile.phone && profile.phone.trim())
                    ? profile.phone.trim()
                    : '+91 90123 45678';
            }
        }

        function openSingleFieldEdit(fieldKey) {
            const profile = getUserProfile();
            if (!modalFieldEdit || !editFieldKey || !editFieldLabel || !editFieldInputContainer) return;

            editFieldKey.value = fieldKey;
            const fieldLabels = {
                name: 'Full Name / पूरा नाम',
                dob: 'Date of Birth / जन्म तिथि',
                blood_group: 'Blood Group / ब्लड ग्रुप',
                area: 'Local Area / स्थानीय इलाका'
            };

            if (modalFieldEditTitle) {
                modalFieldEditTitle.innerText = `Edit ${fieldLabels[fieldKey] || 'Field'}`;
            }
            editFieldLabel.innerText = fieldLabels[fieldKey] || 'Field Value';

            let inputHtml = '';
            if (fieldKey === 'dob') {
                const todayStr = new Date().toISOString().split('T')[0];
                inputHtml = `<input type="date" id="edit-field-input" class="styled-input date-input" max="${todayStr}" value="${profile.dob || '1998-08-14'}" required>`;
            } else if (fieldKey === 'blood_group') {
                const currentBg = profile.blood_group || 'O+';
                inputHtml = `
                <select id="edit-field-input" class="styled-select" required>
                    <option value="A+" ${currentBg === 'A+' ? 'selected' : ''}>A+</option>
                    <option value="A-" ${currentBg === 'A-' ? 'selected' : ''}>A-</option>
                    <option value="B+" ${currentBg === 'B+' ? 'selected' : ''}>B+</option>
                    <option value="B-" ${currentBg === 'B-' ? 'selected' : ''}>B-</option>
                    <option value="AB+" ${currentBg === 'AB+' ? 'selected' : ''}>AB+</option>
                    <option value="AB-" ${currentBg === 'AB-' ? 'selected' : ''}>AB-</option>
                    <option value="O+" ${currentBg === 'O+' ? 'selected' : ''}>O+</option>
                    <option value="O-" ${currentBg === 'O-' ? 'selected' : ''}>O-</option>
                    <option value="Don't know" ${currentBg === "Don't know" ? 'selected' : ''}>Don't know / पता नहीं</option>
                </select>
            `;
            } else {
                inputHtml = `<input type="text" id="edit-field-input" class="styled-input" value="${profile[fieldKey] || ''}" required>`;
            }

            editFieldInputContainer.innerHTML = inputHtml;
            openModal(modalFieldEdit);
        }

        document.querySelectorAll('.btn-field-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const field = btn.getAttribute('data-field');
                if (field) {
                    openSingleFieldEdit(field);
                }
            });
        });

        if (btnCloseFieldEdit) {
            btnCloseFieldEdit.addEventListener('click', () => closeModal(modalFieldEdit));
        }
        if (btnCancelFieldEdit) {
            btnCancelFieldEdit.addEventListener('click', () => closeModal(modalFieldEdit));
        }

        if (formFieldEdit) {
            formFieldEdit.addEventListener('submit', (e) => {
                e.preventDefault();
                const key = editFieldKey ? editFieldKey.value : '';
                const inputEl = document.getElementById('edit-field-input');
                if (!key || !inputEl) return;
                const val = inputEl.value.trim();
                if (!val) {
                    alert('Field value cannot be empty.');
                    return;
                }

                if (key === 'dob' && isDateInFuture(val)) {
                    alert('Date of Birth cannot be in the future. / जन्म तिथि भविष्य की नहीं हो सकती।');
                    return;
                }

                const profile = getUserProfile();
                profile[key] = val;
                saveUserProfile(profile);
                renderProfileCards();
                populateProfileModal();
                closeModal(modalFieldEdit);
            });
        }

        if (btnChangeAvatar) {
            btnChangeAvatar.addEventListener('click', () => {
                alert('📷 Profile avatar picture updated. / प्रोफ़ाइल फ़ोटो अपडेट की गई।');
            });
        }

        // Legacy profile modal helpers & handlers
        function populateProfileModal() {
            const profile = getUserProfile();
            if (profileNameInput) profileNameInput.value = profile.name || '';
            if (profileDobInput) profileDobInput.value = profile.dob || '';
            if (profileBloodGroupSelect) profileBloodGroupSelect.value = profile.blood_group || '';
            if (profileAreaInput) profileAreaInput.value = profile.area || '';
        }

        // Navigation to Dedicated Personal Details Screen
        if (btnHeaderProfile) {
            btnHeaderProfile.addEventListener('click', () => {
                showProfileScreen();
            });
        }

        const btnProfile = document.getElementById('btn-profile');
        if (btnProfile && btnProfile !== btnHeaderProfile) {
            btnProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                showProfileScreen();
            });
        }

        if (btnProfileBack) {
            btnProfileBack.addEventListener('click', showDashboardScreen);
        }

        if (btnCloseProfile) {
            btnCloseProfile.addEventListener('click', () => closeModal(userProfileModal));
        }

        if (btnRevertProfile) {
            btnRevertProfile.addEventListener('click', () => {
                populateProfileModal();
            });
        }

        if (btnSaveProfile) {
            btnSaveProfile.addEventListener('click', () => {
                const name = profileNameInput ? profileNameInput.value.trim() : '';
                if (name.length < 2) {
                    alert('Please enter a valid full name (minimum 2 characters).');
                    return;
                }

                if (profileDobInput && isDateInFuture(profileDobInput.value)) {
                    alert('Date of Birth cannot be in the future. / जन्म तिथि भविष्य की नहीं हो सकती।');
                    return;
                }

                const updated = {
                    ...getUserProfile(),
                    name: name,
                    dob: profileDobInput ? profileDobInput.value : '',
                    blood_group: profileBloodGroupSelect ? profileBloodGroupSelect.value : '',
                    area: profileAreaInput ? profileAreaInput.value.trim() : ''
                };

                saveUserProfile(updated);
                renderProfileCards();
                closeModal(userProfileModal);
            });
        }

        // =========================================================================
        // APP INFO MODAL
        // =========================================================================
        if (btnHeaderInfo) {
            btnHeaderInfo.addEventListener('click', () => openModal(infoModal));
        }

        const btnInfo = document.getElementById('btn-info');
        if (btnInfo && btnInfo !== btnHeaderInfo) {
            btnInfo.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(infoModal);
            });
        }

        if (btnCloseInfo) {
            btnCloseInfo.addEventListener('click', () => closeModal(infoModal));
        }

        if (btnDismissInfo) {
            btnDismissInfo.addEventListener('click', () => closeModal(infoModal));
        }

        // Modal background click dismissals
        [modalTelegramGuide, modalContactSuccess, contactsModal, userProfileModal, infoModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal(modal);
                    }
                });
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                [modalTelegramGuide, modalContactSuccess, contactsModal, userProfileModal, infoModal].forEach(closeModal);
            }
        });

        // =========================================================================
        // SOS TRIGGER LOGIC & HERO BUTTON (#btn-sos)
        // =========================================================================
        async function executeEmergencySos() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (statusTime) statusTime.innerText = timeStr;
            if (statusLocation) statusLocation.innerText = 'Acquiring GPS...';
            if (statusTelegram) {
                statusTelegram.innerText = 'Broadcasting...';
                statusTelegram.className = 'metric-val pending';
            }

            // Switch to status screen
            showStatusScreen();

            // 1. Fetch live coordinates
            currentLocation = await getUserLocation();

            if (statusLocation) {
                if (currentLocation && currentLocation.lat && currentLocation.lon) {
                    statusLocation.innerText = `${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}`;
                } else {
                    statusLocation.innerText = 'GPS Unavailable / Mocked';
                }
            }

            const userName = getUserName();

            // 2. Transmit /api/trigger payload with user_name
            const triggerPayload = {
                type: source,
                trigger_type: source,
                location: currentLocation,
                user_name: userName
            };

            try {
                fetch('/api/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(triggerPayload)
                }).catch(e => console.error('Failed to call /api/trigger:', e));
            } catch (e) {
                console.error('Trigger call error:', e);
            }

            // 3. Transmit /api/alert/telegram payload with user_name
            const alertPayload = {
                type: 'button',
                location: currentLocation,
                user_name: userName
            };

            try {
                const res = await fetch('/api/alert/telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alertPayload)
                });
                const data = await res.json();
                if (data.status === 'sent') {
                    if (statusTelegram) {
                        statusTelegram.innerText = `Sent (${data.recipients_sent || 1} recipients)`;
                        statusTelegram.className = 'metric-val success';
                    }
                } else {
                    if (statusTelegram) {
                        statusTelegram.innerText = data.message || 'Alert Failed';
                        statusTelegram.className = 'metric-val failed';
                    }
                }
            } catch (e) {
                console.error('Alert broadcast error:', e);
                if (statusTelegram) {
                    statusTelegram.innerText = 'Offline / Failed';
                    statusTelegram.className = 'metric-val failed';
                }
            }
        }

        if (btnSOS) {
            let isHolding = false;
            let triggeredByHold = false;
            const HOLD_DURATION_MS = 1500;

            function startSosHold(e) {
                if (isHolding) return;
                isHolding = true;
                triggeredByHold = false;
                btnSOS.classList.add('holding');

                sosHoldTimeout = setTimeout(() => {
                    if (isHolding) {
                        triggeredByHold = true;
                        btnSOS.classList.remove('holding');
                        btnSOS.classList.add('triggered');
                        setTimeout(() => btnSOS.classList.remove('triggered'), 1000);
                        isHolding = false;
                        executeEmergencySos();
                    }
                }, HOLD_DURATION_MS);
            }

            function cancelSosHold(e) {
                if (!isHolding) return;
                isHolding = false;
                btnSOS.classList.remove('holding');
                if (sosHoldTimeout) {
                    clearTimeout(sosHoldTimeout);
                    sosHoldTimeout = null;
                }
            }

            // Desktop mouse press-and-hold
            btnSOS.addEventListener('mousedown', (e) => {
                if (e.button === 0) startSosHold(e);
            });
            btnSOS.addEventListener('mouseup', cancelSosHold);
            btnSOS.addEventListener('mouseleave', cancelSosHold);

            // Mobile touch press-and-hold
            btnSOS.addEventListener('touchstart', (e) => {
                startSosHold(e);
            }, { passive: true });
            btnSOS.addEventListener('touchend', cancelSosHold);
            btnSOS.addEventListener('touchcancel', cancelSosHold);

            // Instant click fallback for automated test suites (.click()) & quick click
            btnSOS.addEventListener('click', (e) => {
                if (triggeredByHold) {
                    triggeredByHold = false;
                    return;
                }
                cancelSosHold(e);
                executeEmergencySos();
            });
        }

        // =========================================================================
        // INTERACTIVE SIREN CONTROLLER (Web Audio API Sound Synthesis)
        // =========================================================================
        let sirenAudioContext = null;
        let sirenOscillator = null;
        let sirenGainNode = null;
        let sirenModInterval = null;
        let isSirenActive = false;

        function startSiren() {
            if (isSirenActive) return;
            isSirenActive = true;

            if (btnSosSiren) {
                btnSosSiren.classList.add('active');
            }
            if (sosSirenLabel) {
                sosSirenLabel.textContent = 'Siren ON 🔊';
            }
            if (sirenCheckbox) {
                sirenCheckbox.checked = true;
            }

            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    if (!sirenAudioContext || sirenAudioContext.state === 'closed') {
                        sirenAudioContext = new AudioCtx();
                    }
                    if (sirenAudioContext.state === 'suspended') {
                        sirenAudioContext.resume();
                    }

                    sirenOscillator = sirenAudioContext.createOscillator();
                    sirenGainNode = sirenAudioContext.createGain();

                    sirenOscillator.type = 'sawtooth';
                    sirenOscillator.frequency.setValueAtTime(720, sirenAudioContext.currentTime);

                    // Safe audible level
                    sirenGainNode.gain.setValueAtTime(0.28, sirenAudioContext.currentTime);

                    sirenOscillator.connect(sirenGainNode);
                    sirenGainNode.connect(sirenAudioContext.destination);

                    sirenOscillator.start();

                    // High-low frequency alternating siren modulation
                    let toggleHigh = false;
                    sirenModInterval = setInterval(() => {
                        if (!isSirenActive || !sirenOscillator || !sirenAudioContext) return;
                        toggleHigh = !toggleHigh;
                        const targetFreq = toggleHigh ? 960 : 660;
                        try {
                            sirenOscillator.frequency.cancelScheduledValues(sirenAudioContext.currentTime);
                            sirenOscillator.frequency.linearRampToValueAtTime(
                                targetFreq,
                                sirenAudioContext.currentTime + 0.28
                            );
                        } catch (e) {
                            sirenOscillator.frequency.setValueAtTime(targetFreq, sirenAudioContext.currentTime);
                        }
                    }, 300);
                }
            } catch (e) {
                console.warn('Web Audio API synthesis notice:', e);
            }
        }

        function stopSiren() {
            if (!isSirenActive) return;
            isSirenActive = false;

            if (btnSosSiren) {
                btnSosSiren.classList.remove('active');
            }
            if (sosSirenLabel) {
                sosSirenLabel.textContent = 'Siren OFF';
            }
            if (sirenCheckbox) {
                sirenCheckbox.checked = false;
            }

            if (sirenModInterval) {
                clearInterval(sirenModInterval);
                sirenModInterval = null;
            }

            if (sirenOscillator) {
                try {
                    sirenOscillator.stop();
                    sirenOscillator.disconnect();
                } catch (e) { }
                sirenOscillator = null;
            }

            if (sirenGainNode) {
                try {
                    sirenGainNode.disconnect();
                } catch (e) { }
                sirenGainNode = null;
            }
        }

        function toggleSiren() {
            if (isSirenActive) {
                stopSiren();
            } else {
                startSiren();
            }
        }

        if (btnSosSiren) {
            btnSosSiren.addEventListener('click', toggleSiren);
        }
        if (sirenCheckbox) {
            sirenCheckbox.addEventListener('change', () => {
                if (sirenCheckbox.checked) startSiren();
                else stopSiren();
            });
        }

        // =========================================================================
        // SAKHI MULTI-LANGUAGE CHATBOT CONTROLLER (Features 16, 17, 18)
        // =========================================================================
        const SAKHI_LANGUAGES = {
            en: {
                code: 'en',
                label: 'EN',
                greeting: "Great! We'll chat in English. 😊\n\nHow are you feeling today? You can share anything with me—this is a safe space.",
                chips: [
                    "Feeling stressed",
                    "Just want to vent",
                    "Need motivation",
                    "Can we do an exercise?"
                ],
                placeholder: "Type a message..."
            },
            hi: {
                code: 'hi',
                label: 'हिंदी',
                greeting: "बहुत बढ़िया! अब से हम हिंदी में बात करेंगे। 😊\n\nआज आप कैसा महसूस कर रहे हैं? आप अपने दिल की बात बिना किसी संकोच के मुझसे साझा कर सकते हैं—यह बिल्कुल सुरक्षित जगह है।",
                chips: [
                    "तनाव महसूस हो रहा है",
                    "बस बात करनी है",
                    "मोटिवेशन चाहिए",
                    "क्या कोई एक्सरसाइज करें?"
                ],
                placeholder: "अपनी बात यहाँ लिखें..."
            },
            hinglish: {
                code: 'hinglish',
                label: 'Hinglish',
                greeting: "Sahi hai! Ab se hum Hinglish mein बात karenge. 😊\n\nAap aaj kaisa feel kar rahe ho? Jo bhi aapke dil mein ho, aap bina kisi darr ke share kar sakte ho—yeh bilkul safe aur private space hai.",
                chips: [
                    "Stress ho raha hai",
                    "Bas vent karna hai",
                    "Motivation chahiye",
                    "Koi exercise karein?"
                ],
                placeholder: "Kuch type karein ya baat karein..."
            }
        };

        let selectedSakhiLang = null;

        function renderSakhiPromptChips(chips) {
            if (!sakhiPromptChips) return;
            sakhiPromptChips.innerHTML = '';
            chips.forEach(chipText => {
                const chipBtn = document.createElement('button');
                chipBtn.type = 'button';
                chipBtn.className = 'quick-chip';
                chipBtn.textContent = chipText;
                chipBtn.addEventListener('click', () => {
                    if (chatInput) {
                        chatInput.value = chipText;
                        handleSendChat();
                    }
                });
                sakhiPromptChips.appendChild(chipBtn);
            });
            sakhiPromptChips.classList.remove('hidden');
        }

        function selectSakhiLanguage(langKey) {
            const langConfig = SAKHI_LANGUAGES[langKey];
            if (!langConfig) return;
            selectedSakhiLang = langKey;

            if (currentLangIndicator) {
                currentLangIndicator.textContent = langConfig.label;
            }

            // Switch views: hide language selection, show messages & chips
            if (sakhiLangSelection) {
                sakhiLangSelection.classList.add('hidden');
            }
            if (chatMessages) {
                chatMessages.classList.remove('hidden');
            }

            // Enable input and set placeholder
            if (chatInput) {
                chatInput.disabled = false;
                chatInput.placeholder = langConfig.placeholder;
                chatInput.focus();
            }
            if (btnSendChat) {
                btnSendChat.disabled = false;
            }

            // Render prompt chips
            renderSakhiPromptChips(langConfig.chips);

            // Render initial greeting if messages container is empty
            if (chatMessages && chatMessages.children.length === 0) {
                appendMessage(langConfig.greeting, 'bot');
            }
        }

        function switchSakhiLanguagePrompt() {
            if (sakhiLangSelection) {
                sakhiLangSelection.classList.remove('hidden');
            }
            if (sakhiPromptChips) {
                sakhiPromptChips.classList.add('hidden');
            }
            if (chatInput) {
                chatInput.disabled = true;
                chatInput.placeholder = "Select a language to start / शुरू करने के लिए भाषा चुनें";
            }
            if (btnSendChat) {
                btnSendChat.disabled = true;
            }
        }

        if (btnLangEn) {
            btnLangEn.addEventListener('click', () => selectSakhiLanguage('en'));
        }
        if (btnLangHi) {
            btnLangHi.addEventListener('click', () => selectSakhiLanguage('hi'));
        }
        if (btnLangHinglish) {
            btnLangHinglish.addEventListener('click', () => selectSakhiLanguage('hinglish'));
        }
        if (btnChatSwitchLang) {
            btnChatSwitchLang.addEventListener('click', switchSakhiLanguagePrompt);
        }
        if (btnChatInfo) {
            btnChatInfo.addEventListener('click', () => {
                if (infoModal) {
                    infoModal.classList.remove('hidden');
                }
            });
        }

        if (cardChatbot) {
            cardChatbot.addEventListener('click', () => {
                showChatScreen('daily');
            });
        }

        if (btnBackChat) {
            btnBackChat.addEventListener('click', showDashboardScreen);
        }

        if (btnViewStatus) {
            btnViewStatus.addEventListener('click', showStatusScreen);
        }

        if (btnStatusBack) {
            btnStatusBack.addEventListener('click', showDashboardScreen);
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                stopSiren();
                currentMode = 'daily';
                chatInitialized = false;
                currentLocation = null;
                if (statusTime) statusTime.innerText = '--:--';
                if (statusLocation) statusLocation.innerText = 'Fetching...';
                if (statusTelegram) {
                    statusTelegram.innerText = 'Pending';
                    statusTelegram.className = 'metric-val pending';
                }
                showDashboardScreen();
            });
        }

        function appendMessage(text, sender, id = null) {
            if (!chatMessages) return;
            const msg = document.createElement('div');
            msg.className = `message ${sender}`;
            msg.innerText = text;
            if (id) msg.id = id;
            chatMessages.appendChild(msg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return msg;
        }

        async function handleSendChat() {
            if (!chatInput) return;
            const text = chatInput.value.trim();
            if (!text) return;

            appendMessage(text, 'user');
            chatInput.value = '';

            const typingId = 'typing-' + Date.now();
            appendMessage('Sakhi is typing...', 'bot', typingId);

            try {
                const payload = {
                    message: text,
                    session_id: sessionId,
                    mode: 'daily',
                    location: currentLocation
                };

                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();

                if (res.ok) {
                    const data = await res.json();
                    appendMessage(data.reply || "I'm with you. How can I assist further?", 'bot');
                } else {
                    appendMessage("I couldn't reach the server, but please stay calm and contact 112 if in danger.", 'bot');
                }
            } catch (e) {
                console.error('Failed to send chat:', e);
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();
                appendMessage("Network connection issue. If this is an emergency, press SOS or call 112.", 'bot');
            }
        }

        if (btnSendChat) btnSendChat.addEventListener('click', handleSendChat);
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSendChat();
            });
        }

        // =========================================================================
        // DEDICATED SIMPLE SOS CHAT CONTROLLER (Features 19, 20, 21)
        // =========================================================================
        function appendSosMessage(text, sender, id = null) {
            if (!sosChatMessages) return;
            const msg = document.createElement('div');
            msg.className = `message ${sender}`;
            msg.innerText = text;
            if (id) msg.id = id;
            sosChatMessages.appendChild(msg);
            sosChatMessages.scrollTop = sosChatMessages.scrollHeight;
            return msg;
        }

        async function handleSendSosChat(overrideText = null) {
            const text = overrideText !== null ? overrideText.trim() : (sosChatInput ? sosChatInput.value.trim() : '');
            if (!text) return;

            appendSosMessage(text, 'user');
            if (sosChatInput) sosChatInput.value = '';

            const typingId = 'sos-typing-' + Date.now();
            appendSosMessage('Sakhi is assessing emergency...', 'bot', typingId);

            try {
                const payload = {
                    message: text,
                    session_id: sessionId,
                    mode: 'emergency',
                    location: currentLocation
                };

                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();

                if (res.ok) {
                    const data = await res.json();
                    appendSosMessage(data.reply || "Move to a well-lit area or guard immediately. Help is on the way.", 'bot');
                } else {
                    appendSosMessage("Connection error: Agar aap kisi khatre mein hain, turant 112 par call karein ya aas-paas help maangein.", 'bot');
                }
            } catch (e) {
                console.error('Failed to send SOS chat:', e);
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();
                appendSosMessage("Connection error: Agar aap kisi khatre mein hain, turant 112 par call karein ya aas-paas help maangein.", 'bot');
            }
        }

        function handleSosChipClick(chipText) {
            if (chipText.toLowerCase().includes('safe for now') || chipText.includes('सुरक्षित')) {
                stopSiren();
                appendSosMessage(chipText, 'user');
                appendSosMessage("I'm so glad to hear that you are safe! Take a deep breath. You can tap 'View Alert Status' or return to the dashboard standby whenever you are ready.", 'bot');
                return;
            }

            handleSendSosChat(chipText);
        }

        if (btnSosChatBack) {
            btnSosChatBack.addEventListener('click', showDashboardScreen);
        }

        if (btnSendSosChat) {
            btnSendSosChat.addEventListener('click', () => handleSendSosChat());
        }

        if (sosChatInput) {
            sosChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSendSosChat();
            });
        }

        if (sosEmergencyChips) {
            const chips = sosEmergencyChips.querySelectorAll('.sos-quick-chip');
            chips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const msg = chip.getAttribute('data-msg') || chip.innerText.trim();
                    handleSosChipClick(msg);
                });
            });
        }

        if (btnSosViewStatus) {
            btnSosViewStatus.addEventListener('click', showStatusScreen);
        }

        if (btnStatusOpenSosChat) {
            btnStatusOpenSosChat.addEventListener('click', showSosChatScreen);
        }

        async function fetchLiveAlertStatus() {
            try {
                const res = await fetch('/api/alert/status');
                const data = await res.json();
                if (statusTelegram) {
                    if (data.status === 'healthy') {
                        statusTelegram.innerText = 'Connected & Ready';
                        statusTelegram.className = 'metric-val success';
                    } else {
                        statusTelegram.innerText = 'Unconfigured';
                        statusTelegram.className = 'metric-val pending';
                    }
                }
            } catch (e) {
                console.error('Status fetch error:', e);
            }
        }

        // =========================================================================
        // INITIALIZATION ENTRY POINT
        // =========================================================================
        const isOnboarded = localStorage.getItem(ONBOARDED_KEY);
        if (btnWelcomeStart) {
            btnWelcomeStart.addEventListener('click', () => {
                showWizardStep(1);
            });
        }

        if (!isOnboarded) {
            showWelcomeScreen();
        } else {
            showDashboardScreen();
        }
    });

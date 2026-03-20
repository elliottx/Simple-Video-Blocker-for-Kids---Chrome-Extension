document.addEventListener('DOMContentLoaded', () => {
    const platforms = ['YouTube', 'TikTok', 'Netflix', 'Hulu'];
    const saveStatus = document.getElementById('saveStatus');
    let saveTimeout;
    
    // Initialize Parental Controls
    const parentalControls = new ParentalControls();

    function showSaveStatus(message, isSuccess = true) {
        saveStatus.textContent = message;
        saveStatus.style.background = isSuccess ? '#4CAF50' : '#f44336';
        saveStatus.classList.add('show');
        
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveStatus.classList.remove('show');
        }, 2000);
    }

    function loadSettings() {
        const storageKeys = platforms.map(p => `allow${p}`);
        
        try {
            chrome.storage.sync.get(storageKeys, (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Error loading settings:', chrome.runtime.lastError.message);
                    showSaveStatus('Error loading settings', false);
                    return;
                }
                
                platforms.forEach(platform => {
                    const blockCheckbox = document.getElementById(`block${platform}`);
                    const allowKey = `allow${platform}`;
                    
                    if (blockCheckbox) {
                        // If allowPlatform is undefined (first install), default to false (blocked)
                        const isAllowed = result[allowKey] !== undefined ? result[allowKey] : false;
                        // Checkbox is checked when platform is blocked (inverted)
                        blockCheckbox.checked = !isAllowed;
                        updateToggleState(blockCheckbox);
                    }
                });
            });
        } catch (error) {
            console.error('Exception in loadSettings:', error);
            showSaveStatus('Error loading settings', false);
        }
    }

    function updateToggleState(checkbox) {
        const settingItem = checkbox.closest('.setting-item');
        if (settingItem) {
            if (checkbox.checked) {
                // Checked = Blocked (red tint)
                settingItem.style.background = '#ffebee';
            } else {
                // Unchecked = Allowed (green tint)
                settingItem.style.background = '#e8f5e9';
            }
        }
    }

    function saveSettings(platform) {
        try {
            const blockCheckbox = document.getElementById(`block${platform}`);
            if (!blockCheckbox) {
                console.error(`Checkbox not found for platform: ${platform}`);
                showSaveStatus('Error: Invalid platform', false);
                return;
            }
            
            const isBlocked = blockCheckbox.checked;
            const allowKey = `allow${platform}`;
            
            // Validate platform name
            if (!platforms.includes(platform)) {
                console.error(`Invalid platform: ${platform}`);
                showSaveStatus('Error: Invalid platform', false);
                return;
            }
            
            // Store as allow value (inverted from UI)
            const settings = {
                [allowKey]: !isBlocked
            };
            
            chrome.storage.sync.set(settings, () => {
                if (chrome.runtime.lastError) {
                    showSaveStatus('Error saving settings', false);
                    console.error('Error saving settings:', chrome.runtime.lastError);
                } else {
                    const status = isBlocked ? 'blocked' : 'allowed';
                    showSaveStatus(`${platform} ${status}`, true);
                }
            });
        } catch (error) {
            console.error('Exception in saveSettings:', error);
            showSaveStatus('Error saving settings', false);
        }
    }

    // Initialize default values on first install
    function initializeDefaults() {
        const storageKeys = platforms.map(p => `allow${p}`);
        
        try {
            chrome.storage.sync.get(storageKeys, (result) => {
                if (chrome.runtime.lastError) {
                    console.error('Error reading storage for defaults:', chrome.runtime.lastError.message);
                    showSaveStatus('Error initializing settings', false);
                    return;
                }
                
                const defaults = {};
                let needsDefaults = false;
                
                platforms.forEach(platform => {
                    const allowKey = `allow${platform}`;
                    if (result[allowKey] === undefined) {
                        // Set platform-specific defaults
                        if (platform === 'Netflix' || platform === 'Hulu') {
                            defaults[allowKey] = true; // Netflix and Hulu allowed by default
                        } else {
                            defaults[allowKey] = false; // YouTube and TikTok blocked by default
                        }
                        needsDefaults = true;
                    }
                });
                
                if (needsDefaults) {
                    chrome.storage.sync.set(defaults, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Error setting defaults:', chrome.runtime.lastError.message);
                            showSaveStatus('Error initializing settings', false);
                        } else {
                            console.log('Default settings initialized: YouTube/TikTok blocked, Netflix/Hulu allowed');
                            loadSettings();
                        }
                    });
                } else {
                    loadSettings();
                }
            });
        } catch (error) {
            console.error('Exception in initializeDefaults:', error);
            showSaveStatus('Error initializing settings', false);
        }
    }

    // Initialize settings
    initializeDefaults();

    // Add event listeners for each platform
    platforms.forEach(platform => {
        const checkbox = document.getElementById(`block${platform}`);
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                updateToggleState(e.target);
                saveSettings(platform);
            });
        }
    });

    // Click anywhere on setting item to toggle
    const settingItems = document.querySelectorAll('.setting-item');
    settingItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.toggle-switch')) {
                const toggle = item.querySelector('input[type="checkbox"]');
                if (toggle) {
                    toggle.checked = !toggle.checked;
                    toggle.dispatchEvent(new Event('change'));
                }
            }
        });
    });

    // Feedback System - Direct link to Google Form
    const feedbackBtn = document.getElementById('feedbackBtn');
    const reviewBtn = document.getElementById('reviewBtn');
    
    // Event listener - Direct link to Google Form
    feedbackBtn.addEventListener('click', () => {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSfd-ZUiDCOylX7BTwNpnS-_A2Da-UBtVFnb2idDjmNfdBcU9Q/viewform?usp=dialog', '_blank');
    });
    
    // Event listener - Direct link to Chrome Web Store reviews
    reviewBtn.addEventListener('click', () => {
        window.open('https://chromewebstore.google.com/detail/simple-video-blocker-for/gilffjhghogfgfdjinemcccoealbnoeg/reviews', '_blank');
    });
    
    // PIN Protection Setup
    const pinSetupBtn = document.getElementById('pinSetupBtn');
    const pinStatus = document.getElementById('pinStatus');
    
    // Check if PIN is set
    function updatePINStatus() {
        chrome.storage.sync.get(['parentalPIN'], (result) => {
            if (result.parentalPIN) {
                pinStatus.textContent = 'PIN protection is active';
                pinSetupBtn.textContent = 'Change PIN';
            } else {
                pinStatus.textContent = 'No PIN set - Settings are unprotected';
                pinSetupBtn.textContent = 'Set PIN';
            }
        });
    }
    
    updatePINStatus();
    
    pinSetupBtn.addEventListener('click', async () => {
        const authorized = await parentalControls.checkPIN();
        if (!authorized) return;
        
        const newPIN = prompt('Enter a new 4-digit PIN:');
        if (!newPIN) return;
        
        if (newPIN.length !== 4 || !/^\d+$/.test(newPIN)) {
            alert('PIN must be exactly 4 digits');
            return;
        }
        
        const confirmPIN = prompt('Confirm your PIN:');
        if (newPIN !== confirmPIN) {
            alert('PINs do not match');
            return;
        }
        
        const success = await parentalControls.setPIN(newPIN);
        if (success) {
            showSaveStatus('PIN set successfully', true);
            updatePINStatus();
        } else {
            showSaveStatus('Error setting PIN', false);
        }
    });
    
    // Daily Time Allowance
    const dailyHours = document.getElementById('dailyHours');
    const timeRemaining = document.getElementById('timeRemaining');
    
    // Load current allowance
    chrome.storage.sync.get(['dailyAllowance'], (result) => {
        if (result.dailyAllowance) {
            dailyHours.value = result.dailyAllowance;
        }
    });
    
    dailyHours.addEventListener('change', async () => {
        const hours = parseFloat(dailyHours.value);
        const success = await parentalControls.setDailyAllowance(hours);
        
        if (success) {
            if (hours > 0) {
                const timeLabel = hours === 0.5 ? '30 minutes' : 
                                hours === 1.5 ? '1 hour 30 minutes' : 
                                hours === 1 ? '1 hour' : 
                                hours === 6 ? '6 hours (maximum)' : `${hours} hours`;
                showSaveStatus(`✓ Timer activated: ${timeLabel}`, true);
            } else {
                showSaveStatus('✓ Videos blocked', true);
            }
            parentalControls.updateTimeDisplay();
        } else {
            showSaveStatus('PIN required to change time settings', false);
            // Revert the change
            chrome.storage.sync.get(['dailyAllowance'], (result) => {
                dailyHours.value = result.dailyAllowance || 0;
            });
        }
    });
    
    // Update time display
    parentalControls.updateTimeDisplay();
    setInterval(() => {
        parentalControls.updateTimeDisplay();
    }, 60000); // Update every minute
    
    // Weekly Schedule
    const scheduleBtn = document.getElementById('scheduleBtn');
    const scheduleSave = document.getElementById('scheduleSave');
    const scheduleCancel = document.getElementById('scheduleCancel');
    const scheduleModal = document.getElementById('scheduleModal');
    
    scheduleBtn.addEventListener('click', async () => {
        const authorized = await parentalControls.checkPIN();
        if (!authorized) {
            showSaveStatus('PIN required to change schedule', false);
            return;
        }
        parentalControls.showScheduleModal();
    });
    
    scheduleSave.addEventListener('click', () => {
        parentalControls.saveSchedule();
        showSaveStatus('Schedule saved', true);
    });
    
    scheduleCancel.addEventListener('click', () => {
        scheduleModal.style.display = 'none';
    });
    
    // --- Keyword Blocking ---
    const keywordInput = document.getElementById('keywordInput');
    const addKeywordsBtn = document.getElementById('addKeywordsBtn');
    const keywordChips = document.getElementById('keywordChips');
    const keywordCount = document.getElementById('keywordCount');
    const keywordBlockingToggle = document.getElementById('keywordBlockingEnabled');

    // Load keyword blocking state and keywords from storage
    function loadKeywordSettings() {
        chrome.storage.sync.get(['keywordBlockingEnabled', 'blockedKeywords'], (result) => {
            if (chrome.runtime.lastError) {
                console.error('Error loading keyword settings:', chrome.runtime.lastError.message);
                return;
            }
            keywordBlockingToggle.checked = result.keywordBlockingEnabled || false;
            renderKeywordChips(result.blockedKeywords || []);
        });
    }

    // Render keyword chips in the UI
    function renderKeywordChips(keywords) {
        keywordChips.innerHTML = '';
        keywords.forEach(keyword => {
            const chip = document.createElement('span');
            chip.className = 'keyword-chip';
            chip.innerHTML = `${keyword}<button class="remove-keyword" data-keyword="${keyword}">&times;</button>`;
            keywordChips.appendChild(chip);
        });
        keywordCount.textContent = keywords.length === 0
            ? 'No keywords set'
            : `${keywords.length} keyword${keywords.length === 1 ? '' : 's'} active`;
    }

    // Add keywords from input field
    function addKeywords() {
        const raw = keywordInput.value.trim();
        if (!raw) return;

        // Split by commas, trim whitespace, remove empties and duplicates
        const newKeywords = raw.split(',')
            .map(k => k.trim().toLowerCase())
            .filter(k => k.length > 0);

        if (newKeywords.length === 0) return;

        chrome.storage.sync.get(['blockedKeywords'], (result) => {
            const existing = result.blockedKeywords || [];
            const merged = [...new Set([...existing, ...newKeywords])];
            chrome.storage.sync.set({ blockedKeywords: merged }, () => {
                if (chrome.runtime.lastError) {
                    showSaveStatus('Error saving keywords', false);
                } else {
                    keywordInput.value = '';
                    renderKeywordChips(merged);
                    showSaveStatus(`${newKeywords.length} keyword${newKeywords.length === 1 ? '' : 's'} added`, true);
                }
            });
        });
    }

    // Remove a single keyword
    function removeKeyword(keyword) {
        chrome.storage.sync.get(['blockedKeywords'], (result) => {
            const updated = (result.blockedKeywords || []).filter(k => k !== keyword);
            chrome.storage.sync.set({ blockedKeywords: updated }, () => {
                if (chrome.runtime.lastError) {
                    showSaveStatus('Error removing keyword', false);
                } else {
                    renderKeywordChips(updated);
                    showSaveStatus(`"${keyword}" removed`, true);
                }
            });
        });
    }

    addKeywordsBtn.addEventListener('click', addKeywords);
    keywordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addKeywords();
    });

    // Delegate click for remove buttons inside chips
    keywordChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-keyword');
        if (btn) removeKeyword(btn.dataset.keyword);
    });

    // Toggle keyword blocking on/off
    keywordBlockingToggle.addEventListener('change', async () => {
        const authorized = await parentalControls.checkPIN();
        if (!authorized) {
            keywordBlockingToggle.checked = !keywordBlockingToggle.checked;
            showSaveStatus('PIN required to change settings', false);
            return;
        }
        chrome.storage.sync.set({ keywordBlockingEnabled: keywordBlockingToggle.checked }, () => {
            if (chrome.runtime.lastError) {
                showSaveStatus('Error saving setting', false);
            } else {
                const state = keywordBlockingToggle.checked ? 'enabled' : 'disabled';
                showSaveStatus(`Keyword blocking ${state}`, true);
            }
        });
    });

    loadKeywordSettings();

    // --- Channel Whitelist ---
    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelChips = document.getElementById('channelChips');
    const channelCount = document.getElementById('channelCount');
    const channelWhitelistToggle = document.getElementById('channelWhitelistEnabled');

    function loadChannelSettings() {
        chrome.storage.sync.get(['channelWhitelistEnabled', 'whitelistedChannels'], (result) => {
            if (chrome.runtime.lastError) return;
            channelWhitelistToggle.checked = result.channelWhitelistEnabled || false;
            renderChannelChips(result.whitelistedChannels || []);
        });
    }

    function renderChannelChips(channels) {
        channelChips.innerHTML = '';
        channels.forEach(channel => {
            const chip = document.createElement('span');
            chip.className = 'keyword-chip';
            chip.innerHTML = `${channel.name}<button class="remove-keyword" data-channel="${channel.handle}">&times;</button>`;
            channelChips.appendChild(chip);
        });
        channelCount.textContent = channels.length === 0
            ? 'No approved channels'
            : `${channels.length} channel${channels.length === 1 ? '' : 's'} approved`;
    }

    function parseChannelInput(raw) {
        // Accept: @handle, channel name, or youtube.com/@handle URL
        raw = raw.trim();
        let handle = '';
        let name = raw;

        // Extract handle from URL
        const urlMatch = raw.match(/youtube\.com\/@?([\w-]+)/i);
        if (urlMatch) {
            handle = urlMatch[1].toLowerCase();
            name = '@' + handle;
        } else if (raw.startsWith('@')) {
            handle = raw.substring(1).toLowerCase();
            name = raw;
        } else {
            // Plain name — use as-is for display, lowercase for matching
            handle = raw.toLowerCase().replace(/\s+/g, '');
            name = raw;
        }
        return { handle, name };
    }

    function addChannel() {
        const raw = channelInput.value.trim();
        if (!raw) return;

        const parsed = parseChannelInput(raw);
        if (!parsed.handle) return;

        chrome.storage.sync.get(['whitelistedChannels'], (result) => {
            const existing = result.whitelistedChannels || [];
            // Check for duplicate handles
            if (existing.some(c => c.handle === parsed.handle)) {
                showSaveStatus('Channel already added', false);
                return;
            }
            const updated = [...existing, parsed];
            chrome.storage.sync.set({ whitelistedChannels: updated }, () => {
                if (chrome.runtime.lastError) {
                    showSaveStatus('Error saving channel', false);
                } else {
                    channelInput.value = '';
                    renderChannelChips(updated);
                    showSaveStatus(`${parsed.name} added`, true);
                }
            });
        });
    }

    function removeChannel(handle) {
        chrome.storage.sync.get(['whitelistedChannels'], (result) => {
            const updated = (result.whitelistedChannels || []).filter(c => c.handle !== handle);
            chrome.storage.sync.set({ whitelistedChannels: updated }, () => {
                if (chrome.runtime.lastError) {
                    showSaveStatus('Error removing channel', false);
                } else {
                    renderChannelChips(updated);
                    showSaveStatus('Channel removed', true);
                }
            });
        });
    }

    addChannelBtn.addEventListener('click', addChannel);
    channelInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addChannel();
    });

    channelChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-keyword');
        if (btn && btn.dataset.channel) removeChannel(btn.dataset.channel);
    });

    channelWhitelistToggle.addEventListener('change', async () => {
        const authorized = await parentalControls.checkPIN();
        if (!authorized) {
            channelWhitelistToggle.checked = !channelWhitelistToggle.checked;
            showSaveStatus('PIN required to change settings', false);
            return;
        }
        chrome.storage.sync.set({ channelWhitelistEnabled: channelWhitelistToggle.checked }, () => {
            if (chrome.runtime.lastError) {
                showSaveStatus('Error saving setting', false);
            } else {
                const state = channelWhitelistToggle.checked ? 'enabled' : 'disabled';
                showSaveStatus(`Channel whitelist ${state}`, true);
            }
        });
    });

    loadChannelSettings();

    // --- YouTube Shorts Blocking ---
    const blockShortsToggle = document.getElementById('blockShorts');

    // Load Shorts blocking state
    chrome.storage.sync.get(['blockShorts'], (result) => {
        if (chrome.runtime.lastError) return;
        blockShortsToggle.checked = result.blockShorts || false;
        updateToggleState(blockShortsToggle);
    });

    blockShortsToggle.addEventListener('change', async () => {
        const authorized = await parentalControls.checkPIN();
        if (!authorized) {
            blockShortsToggle.checked = !blockShortsToggle.checked;
            showSaveStatus('PIN required to change settings', false);
            return;
        }
        updateToggleState(blockShortsToggle);
        chrome.storage.sync.set({ blockShorts: blockShortsToggle.checked }, () => {
            if (chrome.runtime.lastError) {
                showSaveStatus('Error saving setting', false);
            } else {
                const state = blockShortsToggle.checked ? 'blocked' : 'allowed';
                showSaveStatus(`YouTube Shorts ${state}`, true);
            }
        });
    });

    // Protect platform toggles with PIN
    platforms.forEach(platform => {
        const checkbox = document.getElementById(`block${platform}`);
        if (checkbox) {
            // Store the original change handler
            const originalHandler = checkbox.onchange;
            
            // Replace with PIN-protected handler
            checkbox.addEventListener('change', async (e) => {
                const authorized = await parentalControls.checkPIN();
                if (!authorized) {
                    // Revert the change
                    e.preventDefault();
                    checkbox.checked = !checkbox.checked;
                    showSaveStatus('PIN required to change settings', false);
                    return;
                }
                
                // Continue with original behavior
                updateToggleState(e.target);
                saveSettings(platform);
            });
        }
    });
});
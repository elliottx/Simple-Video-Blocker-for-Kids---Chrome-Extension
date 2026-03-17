let settings = {
  allowHulu: false,
  allowNetflix: false,
  allowYouTube: false,
  allowTikTok: false
};

let timeRestrictions = {
  dailyAllowance: 0,
  timerExpires: null,
  weeklySchedule: null
};

// Keyword blocking state
let keywordBlockingEnabled = false;
let blockedKeywords = [];

// YouTube Shorts blocking state
let blockShorts = false;

function loadSettings() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get([
        'allowHulu', 'allowNetflix', 'allowYouTube', 'allowTikTok',
        'dailyAllowance', 'timerExpires', 'weeklySchedule',
        'keywordBlockingEnabled', 'blockedKeywords', 'blockShorts'
      ], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading settings in content script:', chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError);
          return;
        }
        settings = { ...settings, ...result };
        timeRestrictions.dailyAllowance = result.dailyAllowance || 0;
        timeRestrictions.timerExpires = result.timerExpires || null;
        timeRestrictions.weeklySchedule = result.weeklySchedule || null;

        // Load keyword blocking settings
        keywordBlockingEnabled = result.keywordBlockingEnabled || false;
        blockedKeywords = result.blockedKeywords || [];
        blockShorts = result.blockShorts || false;

        console.log('Raw storage result:', result);
        console.log('Content script settings loaded:', settings);
        console.log('Time restrictions loaded:', timeRestrictions);
        console.log('Keyword blocking:', keywordBlockingEnabled, 'keywords:', blockedKeywords);
        console.log('Block Shorts:', blockShorts);
        console.log('Timer expires at:', timeRestrictions.timerExpires ? new Date(timeRestrictions.timerExpires) : 'null');
        resolve();
      });
    } catch (error) {
      console.error('Exception in loadSettings:', error);
      reject(error);
    }
  });
}

function checkTimeAllowed() {
  console.log('checkTimeAllowed() - dailyAllowance:', timeRestrictions.dailyAllowance);
  console.log('checkTimeAllowed() - timerExpires:', timeRestrictions.timerExpires);
  console.log('checkTimeAllowed() - current time:', Date.now());
  
  // Check daily timer
  if (timeRestrictions.dailyAllowance === 0) {
    // No videos allowed
    console.log('Videos blocked - dailyAllowance is 0');
    return false;
  } else if (timeRestrictions.dailyAllowance > 0) {
    // Check if countdown timer has expired
    if (timeRestrictions.timerExpires && Date.now() > timeRestrictions.timerExpires) {
      console.log('Timer expired - countdown finished at', new Date(timeRestrictions.timerExpires));
      return false;
    } else {
      const remaining = timeRestrictions.timerExpires ? Math.floor((timeRestrictions.timerExpires - Date.now()) / 1000 / 60) : 0;
      console.log('Timer active - minutes remaining:', remaining);
      return true;
    }
  }
  
  // Check weekly schedule - only if no timer is active
  if (!timeRestrictions.dailyAllowance && timeRestrictions.weeklySchedule) {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    
    const scheduleAllows = timeRestrictions.weeklySchedule[day] && 
                          timeRestrictions.weeklySchedule[day][hour] === true;
    
    console.log('Schedule check:', {
      day: day,
      hour: hour,
      scheduleAllows: scheduleAllows
    });
    
    if (!scheduleAllows) {
      console.log('Videos blocked by schedule');
      return false;
    }
    
    console.log('Videos allowed by schedule');
    return true;
  }
  
  return true;
}

function isBlockedDomain(domain) {
  // Check if it's a video platform
  const isVideoPlatform = domain.includes('hulu.com') || 
                          domain.includes('netflix.com') || 
                          domain.includes('youtube.com') || 
                          domain.includes('youtu.be') ||
                          domain.includes('tiktok.com') || 
                          domain.includes('musical.ly');
  
  if (!isVideoPlatform) return false;
  
  // Check time restrictions FIRST
  const timeAllowed = checkTimeAllowed();
  console.log('checkTimeAllowed() returned:', timeAllowed);
  
  if (!timeAllowed) {
    console.log('Blocking due to time restrictions - timer expired or no time allowed');
    return true; // Block if time not allowed
  }
  
  // TIMER OVERRIDES PLATFORM SETTINGS
  // If we have an active timer (dailyAllowance > 0), allow all video platforms
  if (timeRestrictions.dailyAllowance > 0) {
    console.log('Timer is active - overriding platform settings, allowing videos');
    return false; // Don't block - timer allows all videos
  }
  
  // No timer active, check individual platform settings
  const platformBlocked = (
    (domain.includes('hulu.com') && !settings.allowHulu) ||
    (domain.includes('netflix.com') && !settings.allowNetflix) ||
    ((domain.includes('youtube.com') || domain.includes('youtu.be')) && !settings.allowYouTube) ||
    ((domain.includes('tiktok.com') || domain.includes('musical.ly')) && !settings.allowTikTok)
  );
  
  console.log('Platform blocked by individual settings:', platformBlocked);
  console.log('Final blocking decision:', platformBlocked);
  
  return platformBlocked;
}

function muteAndPauseMedia() {
  const currentDomain = window.location.hostname;
  if (!isBlockedDomain(currentDomain)) return;

  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(element => {
    element.muted = true;
    element.pause();
  });
}

function removeVideos() {
  const currentDomain = window.location.hostname;
  let blockedCount = 0;
  
  // Only remove embedded YouTube/TikTok iframes from any domain
  const iframes = document.getElementsByTagName('iframe');
  for (let i = iframes.length - 1; i >= 0; i--) {
    const src = iframes[i].src.toLowerCase();
    if (
      (src.includes('youtube.com/embed') && !settings.allowYouTube) ||
      (src.includes('youtu.be') && !settings.allowYouTube) ||
      (src.includes('youtube-nocookie.com') && !settings.allowYouTube) ||
      ((src.includes('tiktok.com') || src.includes('musical.ly')) && !settings.allowTikTok)
    ) {
      iframes[i].remove();
      blockedCount++;
    }
  }

  // Only remove videos if we're actually on a blocked domain
  if (isBlockedDomain(currentDomain)) {
    // Mute and remove video elements
    const videos = document.getElementsByTagName('video');
    for (let i = videos.length - 1; i >= 0; i--) {
      videos[i].muted = true;
      videos[i].pause();
      videos[i].remove();
      blockedCount++;
    }

    // Mute audio elements
    const audios = document.getElementsByTagName('audio');
    for (let i = audios.length - 1; i >= 0; i--) {
      audios[i].muted = true;
      audios[i].pause();
    }
  }

  // Remove YouTube custom embed elements from any domain
  if (!settings.allowYouTube) {
    const ytElements = document.getElementsByTagName('yt-embed');
    for (let i = ytElements.length - 1; i >= 0; i--) {
      ytElements[i].remove();
      blockedCount++;
    }
  }
  
  // Badge updates are handled by notifyVideoStatus() calls
  
  return blockedCount;
}

function removeYouTubeNoCookieVideos() {
  if (settings.allowYouTube) return;

  const videos = document.querySelectorAll('video[src^="blob:https://www.youtube-nocookie.com/"]');
  videos.forEach(video => {
    video.pause();
    video.remove();
  });
}

// --- Keyword Blocking: hide YouTube videos whose titles match blocked keywords ---
function filterVideosByKeyword() {
  // Only run on YouTube
  if (!window.location.hostname.includes('youtube.com')) return 0;
  if (!keywordBlockingEnabled || blockedKeywords.length === 0) return 0;

  let hiddenCount = 0;

  // YouTube video renderers used on home, search, sidebar, and channel pages
  const videoSelectors = [
    'ytd-video-renderer',           // search results
    'ytd-rich-item-renderer',       // home page grid items
    'ytd-compact-video-renderer',   // sidebar recommendations
    'ytd-grid-video-renderer',      // channel page grid
    'ytd-reel-item-renderer'        // Shorts shelf items (also caught by Shorts blocker)
  ];

  const renderers = document.querySelectorAll(videoSelectors.join(','));

  renderers.forEach(renderer => {
    // Skip already-processed elements
    if (renderer.dataset.svbKeywordChecked === 'true') return;
    renderer.dataset.svbKeywordChecked = 'true';

    // Extract video title text from the renderer
    const titleEl = renderer.querySelector(
      '#video-title, #title-wrapper, h3 a, .title, [id="video-title"]'
    );
    if (!titleEl) return;

    const titleText = (titleEl.textContent || titleEl.innerText || '').toLowerCase();

    // Check if any blocked keyword appears in the title
    const matchedKeyword = blockedKeywords.find(kw => titleText.includes(kw));

    if (matchedKeyword) {
      // Replace the renderer content with a placeholder
      renderer.style.position = 'relative';
      renderer.innerHTML = '';
      const placeholder = document.createElement('div');
      placeholder.className = 'svb-blocked-placeholder';
      placeholder.style.cssText =
        'background:#f5f5f5;border:2px dashed #ccc;border-radius:8px;padding:20px;' +
        'text-align:center;color:#999;font-size:14px;display:flex;align-items:center;' +
        'justify-content:center;min-height:100px;width:100%;font-family:sans-serif;';
      placeholder.textContent = 'Video blocked by SVB';
      renderer.appendChild(placeholder);
      hiddenCount++;
      console.log(`SVB: Blocked video matching keyword "${matchedKeyword}":`, titleText.substring(0, 60));
    }
  });

  return hiddenCount;
}

// --- YouTube Shorts Blocking: hide Shorts shelves and redirect Shorts URLs ---
function hideYouTubeShorts() {
  if (!blockShorts) return 0;
  if (!window.location.hostname.includes('youtube.com')) return 0;

  let hiddenCount = 0;

  // 1. Hide Shorts shelf sections on home page and search
  const shortsShelfSelectors = [
    'ytd-rich-shelf-renderer[is-shorts]',                          // home page Shorts shelf
    'ytd-reel-shelf-renderer',                                     // Shorts reel shelf
    'ytd-rich-section-renderer:has(ytd-reel-shelf-renderer)',      // wrapper around Shorts shelf
    'ytd-rich-section-renderer:has([is-shorts])'                   // alternate wrapper
  ];

  shortsShelfSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.style.display !== 'none') {
        el.style.display = 'none';
        hiddenCount++;
      }
    });
  });

  // 2. Hide individual Shorts links/thumbnails in other contexts
  const shortsLinks = document.querySelectorAll('a[href*="/shorts/"]');
  shortsLinks.forEach(link => {
    // Walk up to the nearest video renderer or item container
    const container = link.closest(
      'ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ' +
      'ytd-grid-video-renderer, ytd-reel-item-renderer'
    );
    if (container && container.style.display !== 'none') {
      container.style.display = 'none';
      hiddenCount++;
    }
  });

  // 3. Hide the Shorts tab in the sidebar/guide
  document.querySelectorAll('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer').forEach(entry => {
    const link = entry.querySelector('a[title="Shorts"]');
    if (link && entry.style.display !== 'none') {
      entry.style.display = 'none';
      hiddenCount++;
    }
  });

  // 4. If the user navigated to a /shorts/ URL, redirect to home
  if (window.location.pathname.startsWith('/shorts/') || window.location.pathname === '/shorts') {
    console.log('SVB: Blocking YouTube Shorts page, redirecting to home');
    window.location.replace('https://www.youtube.com');
    return hiddenCount;
  }

  return hiddenCount;
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    try {
      // Update settings when they change
      chrome.storage.sync.get([
        'allowHulu', 'allowNetflix', 'allowYouTube', 'allowTikTok',
        'dailyAllowance', 'timerExpires', 'weeklySchedule',
        'keywordBlockingEnabled', 'blockedKeywords', 'blockShorts'
      ], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error updating settings in content script:', chrome.runtime.lastError.message);
          return;
        }

        settings = { ...settings, ...result };
        timeRestrictions.dailyAllowance = result.dailyAllowance || 0;
        timeRestrictions.timerExpires = result.timerExpires || null;
        timeRestrictions.weeklySchedule = result.weeklySchedule || null;
        keywordBlockingEnabled = result.keywordBlockingEnabled || false;
        blockedKeywords = result.blockedKeywords || [];
        blockShorts = result.blockShorts || false;

        console.log('Settings updated:', settings);
        console.log('Time restrictions updated:', timeRestrictions);
        
        // Reapply blocking based on new settings
        const currentDomain = window.location.hostname;
        const shouldBlock = isBlockedDomain(currentDomain);
        
        if (!shouldBlock) {
          // Videos should be allowed - reload page to restore functionality
          console.log('Videos now allowed - reloading page');
          window.location.reload();
        } else {
          // Videos should be blocked - immediately block content
          console.log('Videos should be blocked - applying blocks');
          try {
            removeVideos();
            muteAndPauseMedia();
          } catch (error) {
            console.error('Error applying blocks after settings change:', error);
          }
        }

        // Always re-run keyword filtering and Shorts blocking on setting changes
        filterVideosByKeyword();
        hideYouTubeShorts();
      });
    } catch (error) {
      console.error('Exception in storage change listener:', error);
    }
  }
});

// Function to notify background about video platform status
function notifyVideoStatus() {
  const currentDomain = window.location.hostname;
  
  // Check if this is a video platform
  const isVideoPlatform = currentDomain.includes('hulu.com') || 
                          currentDomain.includes('netflix.com') || 
                          currentDomain.includes('youtube.com') || 
                          currentDomain.includes('youtu.be') ||
                          currentDomain.includes('tiktok.com') || 
                          currentDomain.includes('musical.ly');
  
  if (!isVideoPlatform) {
    // Not a video platform - clear badge
    try {
      chrome.runtime.sendMessage({ type: 'noContentBlocked' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    return;
  }
  
  // This is a video platform - check if we're blocking or allowing
  const shouldBlock = isBlockedDomain(currentDomain);
  
  try {
    if (shouldBlock) {
      console.log('Video platform - blocking active on:', currentDomain);
      chrome.runtime.sendMessage({ type: 'contentBlocked' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending blocked message:', chrome.runtime.lastError);
        } else {
          console.log('Blocking badge update sent successfully');
        }
      });
    } else {
      console.log('Video platform - videos allowed on:', currentDomain);
      chrome.runtime.sendMessage({ type: 'contentAllowed' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending allowed message:', chrome.runtime.lastError);
        } else {
          console.log('Allowing badge update sent successfully');
        }
      });
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

// Timer is now a simple countdown - no video tracking needed

loadSettings().then(() => {
  console.log('Initial settings loaded:', settings);
  console.log('Time restrictions loaded:', timeRestrictions);
  
  // Check if we should block or allow
  const currentDomain = window.location.hostname;
  const shouldBlock = isBlockedDomain(currentDomain);
  
  console.log('Should block domain', currentDomain, ':', shouldBlock);
  
  try {
    if (shouldBlock) {
      // Run blocking on page load
      removeVideos();
      muteAndPauseMedia();

      // Notify background about video status
      notifyVideoStatus();
    } else {
      console.log('Videos allowed - not blocking');
      // Still notify if we're on a video platform but allowing videos
      notifyVideoStatus();
    }

    // Run keyword filtering and Shorts blocking regardless of platform block state
    // (these are independent content filters that work on top of platform blocking)
    filterVideosByKeyword();
    hideYouTubeShorts();

    // Set up a MutationObserver to handle dynamically loaded content
    const observer = new MutationObserver(() => {
      try {
        const blockedCount = removeVideos();
        muteAndPauseMedia();

        // Run content filters on every DOM mutation (YouTube loads content dynamically)
        filterVideosByKeyword();
        hideYouTubeShorts();

        // Update badge when content changes
        if (blockedCount > 0) {
          // We just blocked new content, update badge
          notifyVideoStatus();
        }
      } catch (error) {
        console.error('Error in MutationObserver callback:', error);
      }
    });
    
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      // Wait for body to be available
      const bodyObserver = new MutationObserver(() => {
        if (document.body) {
          bodyObserver.disconnect();
          observer.observe(document.body, { childList: true, subtree: true });
        }
      });
      bodyObserver.observe(document.documentElement, { childList: true });
    }
  } catch (error) {
    console.error('Error during content script initialization:', error);
  }

  // Block audio context only for blocked domains
  const originalAudioContext = window.AudioContext || window.webkitAudioContext;
  window.AudioContext = window.webkitAudioContext = function() {
    const currentDomain = window.location.hostname;
    if (!isBlockedDomain(currentDomain)) {
      return new originalAudioContext();
    }
    return {
      createMediaElementSource: function() {
        return { connect: function() {} };
      },
      createGain: function() {
        return { connect: function() {} };
      },
      // Add other methods as needed, returning dummy objects
    };
  };

  // Intercept play attempts only on blocked domains
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function() {
    const currentDomain = window.location.hostname;
    if (!isBlockedDomain(currentDomain)) {
      return originalPlay.apply(this);
    }
    this.pause();
    this.muted = true;
    return Promise.reject(new DOMException('Play prevented by extension', 'NotAllowedError'));
  };
}).catch((error) => {
  console.error('Error loading initial settings:', error);
  // Continue with default settings (all blocked) if storage fails
  console.log('Continuing with default blocked settings due to storage error');
  try {
    removeVideos();
    muteAndPauseMedia();
  } catch (blockingError) {
    console.error('Error applying default blocking:', blockingError);
  }
});

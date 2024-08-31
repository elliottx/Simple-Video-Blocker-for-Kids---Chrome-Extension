let settings = {
  allowHulu: false,
  allowNetflix: false,
  allowYouTube: false,
  allowTikTok: false
};

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['allowHulu', 'allowNetflix', 'allowYouTube', 'allowTikTok'], (result) => {
      settings = { ...settings, ...result };
      resolve();
    });
  });
}

function isAllowed(domain) {
  return (
    (domain.includes('hulu.com') && settings.allowHulu) ||
    (domain.includes('netflix.com') && settings.allowNetflix) ||
    ((domain.includes('youtube.com') || domain.includes('youtu.be')) && settings.allowYouTube) ||
    (domain.includes('tiktok.com') && settings.allowTikTok)
  );
}

function muteAndPauseMedia() {
  const currentDomain = window.location.hostname;
  if (isAllowed(currentDomain)) return;

  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(element => {
    element.muted = true;
    element.pause();
  });
}

function removeVideos() {
  const currentDomain = window.location.hostname;
  if (isAllowed(currentDomain)) return;

  // Remove iframes
  const iframes = document.getElementsByTagName('iframe');
  for (let i = iframes.length - 1; i >= 0; i--) {
    const src = iframes[i].src.toLowerCase();
    if (
      src.includes('youtube.com/embed') ||
      src.includes('youtu.be') ||
      src.includes('tiktok.com/embed') ||
      src.includes('youtube-nocookie.com')
    ) {
      iframes[i].remove();
    }
  }

  // Mute and remove video elements
  const videos = document.getElementsByTagName('video');
  for (let i = videos.length - 1; i >= 0; i--) {
    videos[i].muted = true;
    videos[i].pause();
    videos[i].remove();
  }

  // Remove YouTube custom embed
  const ytElements = document.getElementsByTagName('yt-embed');
  for (let i = ytElements.length - 1; i >= 0; i--) {
    ytElements[i].remove();
  }

  // Mute audio elements
  const audios = document.getElementsByTagName('audio');
  for (let i = audios.length - 1; i >= 0; i--) {
    audios[i].muted = true;
    audios[i].pause();
  }
}

function removeYouTubeNoCookieVideos() {
  const currentDomain = window.location.hostname;
  if (isAllowed(currentDomain)) return;

  const videos = document.querySelectorAll('video[src^="blob:https://www.youtube-nocookie.com/"]');
  videos.forEach(video => {
    video.pause();
    video.remove();
  });
}

loadSettings().then(() => {
  // Run on page load
  removeVideos();
  muteAndPauseMedia();

  // Set up a MutationObserver to handle dynamically loaded content
  const observer = new MutationObserver(() => {
    removeVideos();
    muteAndPauseMedia();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Block audio context except for allowed domains
  const originalAudioContext = window.AudioContext || window.webkitAudioContext;
  window.AudioContext = window.webkitAudioContext = function() {
    const currentDomain = window.location.hostname;
    if (isAllowed(currentDomain)) {
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

  // Intercept play attempts
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function() {
    const currentDomain = window.location.hostname;
    if (isAllowed(currentDomain)) {
      return originalPlay.apply(this);
    }
    this.pause();
    this.muted = true;
    return Promise.reject(new DOMException('Play prevented by extension', 'NotAllowedError'));
  };
});

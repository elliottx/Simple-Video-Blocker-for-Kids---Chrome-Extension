// Immediately mute and pause all audio and video elements
function muteAndPauseMedia() {
  const currentDomain = window.location.hostname;
  if (currentDomain.includes('netflix.com') || currentDomain.includes('hulu.com')) {
    return; // Exit the function if we're on Netflix or Hulu
  }

  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(element => {
    element.muted = true;
    element.pause();
  });
}

// Run muteAndPauseMedia immediately and periodically, except for Netflix and Hulu
const currentDomain = window.location.hostname;
if (!currentDomain.includes('netflix.com') && !currentDomain.includes('hulu.com')) {
  muteAndPauseMedia();
  setInterval(muteAndPauseMedia, 1000);
}

function removeVideos() {
  // Check if the current domain is Netflix or Hulu
  const currentDomain = window.location.hostname;
  if (currentDomain.includes('netflix.com') || currentDomain.includes('hulu.com')) {
    return; // Exit the function if we're on Netflix or Hulu
  }

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
    if (!currentDomain.includes('netflix.com') && !currentDomain.includes('hulu.com')) {
      videos[i].muted = true;
      videos[i].pause();
      videos[i].remove();
    }
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

  // Remove YouTube-nocookie videos
  removeYouTubeNoCookieVideos();
}

function removeYouTubeNoCookieVideos() {
  const videos = document.querySelectorAll('video[src^="blob:https://www.youtube-nocookie.com/"]');
  videos.forEach(video => {
    video.pause();
    video.remove();
  });
}

// Run on page load
removeVideos();

// Set up a MutationObserver to handle dynamically loaded content
const observer = new MutationObserver(() => {
  const currentDomain = window.location.hostname;
  if (!currentDomain.includes('netflix.com') && !currentDomain.includes('hulu.com')) {
    removeVideos();
    muteAndPauseMedia();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Block audio context except for Netflix and Hulu
const originalAudioContext = window.AudioContext || window.webkitAudioContext;
window.AudioContext = window.webkitAudioContext = function() {
  const currentDomain = window.location.hostname;
  if (currentDomain.includes('netflix.com') || currentDomain.includes('hulu.com')) {
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
  if (currentDomain.includes('netflix.com') || currentDomain.includes('hulu.com')) {
    return originalPlay.apply(this); // Allow play on Netflix and Hulu
  }
  this.pause();
  this.muted = true;
  return Promise.reject(new DOMException('Play prevented by extension', 'NotAllowedError'));
};

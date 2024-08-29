// Immediately mute and pause all audio and video elements
function muteAndPauseMedia() {
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(element => {
    element.muted = true;
    element.pause();
  });
}

// Run muteAndPauseMedia immediately and periodically
muteAndPauseMedia();
setInterval(muteAndPauseMedia, 1000);

function removeVideos() {
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
  removeVideos();
  muteAndPauseMedia();
});
observer.observe(document.body, { childList: true, subtree: true });

// Block audio context
const originalAudioContext = window.AudioContext || window.webkitAudioContext;
window.AudioContext = window.webkitAudioContext = function() {
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
  this.pause();
  this.muted = true;
  return Promise.reject(new DOMException('Play prevented by extension', 'NotAllowedError'));
};

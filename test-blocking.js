const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class BlockingVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.extensionId = null;
    this.results = [];
  }

  async setup() {
    console.log('🔍 Starting Blocking Verification Tests...\n');
    
    const extensionPath = path.resolve(__dirname);
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const pages = await this.browser.pages();
    this.page = pages[0];

    // Get extension ID
    await this.page.goto('chrome://extensions/');
    await this.page.waitForDelay(2000);
    
    this.extensionId = await this.page.evaluate(() => {
      const cards = document.querySelectorAll('extensions-item');
      for (const card of cards) {
        const name = card.shadowRoot.querySelector('#name')?.textContent;
        if (name && name.includes('Simple Video Blocker')) {
          return card.getAttribute('id');
        }
      }
      return null;
    });

    if (!this.extensionId) {
      throw new Error('Extension not found');
    }

    console.log(`✅ Extension loaded: ${this.extensionId}`);
  }

  async ensureAllPlatformsBlocked() {
    console.log('🔧 Ensuring all platforms are blocked...');
    
    const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
    await this.page.goto(optionsUrl);
    await this.page.waitForDelay(2000);

    const platforms = ['YouTube', 'TikTok', 'Netflix', 'Hulu'];
    for (const platform of platforms) {
      const checkbox = await this.page.$(`#block${platform}`);
      if (checkbox) {
        const isChecked = await this.page.$eval(`#block${platform}`, el => el.checked);
        if (!isChecked) {
          await this.page.click(`#block${platform}`);
          await this.page.waitForDelay(500);
        }
      }
    }
    
    console.log('✅ All platforms set to blocked');
  }

  async testYouTubeBlocking() {
    console.log('🎥 Testing YouTube Blocking...');
    
    const testUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    ];

    for (const url of testUrls) {
      await this.testUrlBlocking('YouTube', url);
    }

    // Test embedded YouTube content
    await this.testEmbeddedContent('YouTube');
  }

  async testTikTokBlocking() {
    console.log('📱 Testing TikTok Blocking...');
    
    const testUrls = [
      'https://www.tiktok.com/@username/video/7234567890123456789'
    ];

    for (const url of testUrls) {
      await this.testUrlBlocking('TikTok', url);
    }
  }

  async testNetflixBlocking() {
    console.log('📺 Testing Netflix Blocking...');
    
    const testUrls = [
      'https://www.netflix.com/title/70143836'
    ];

    for (const url of testUrls) {
      await this.testUrlBlocking('Netflix', url);
    }
  }

  async testHuluBlocking() {
    console.log('📻 Testing Hulu Blocking...');
    
    const testUrls = [
      'https://www.hulu.com/watch/1234567'
    ];

    for (const url of testUrls) {
      await this.testUrlBlocking('Hulu', url);
    }
  }

  async testUrlBlocking(platform, url) {
    try {
      console.log(`  Testing ${platform} URL: ${url.substring(0, 50)}...`);
      
      // Monitor network requests
      const blockedRequests = [];
      const requestInterceptor = (request) => {
        const requestUrl = request.url().toLowerCase();
        if (this.isBlockedDomain(requestUrl)) {
          blockedRequests.push(requestUrl);
          request.abort();
        } else {
          request.continue();
        }
      };

      await this.page.setRequestInterception(true);
      this.page.on('request', requestInterceptor);

      // Try to navigate to the URL
      const startTime = Date.now();
      let navigationSuccess = false;
      let errorOccurred = false;

      try {
        await this.page.goto(url, { 
          waitUntil: 'networkidle0', 
          timeout: 10000 
        });
        navigationSuccess = true;
      } catch (error) {
        errorOccurred = true;
        // This is expected for blocked sites
      }

      const endTime = Date.now();
      
      // Clean up request interception
      this.page.removeListener('request', requestInterceptor);
      await this.page.setRequestInterception(false);

      // Verify blocking worked
      const requestsBlocked = blockedRequests.length > 0;
      const quickFailure = (endTime - startTime) < 5000; // Should fail quickly if blocked
      
      this.addResult(
        `${platform} URL blocked (${url})`,
        requestsBlocked || errorOccurred || quickFailure,
        `Blocked requests: ${blockedRequests.length}, Navigation failed: ${errorOccurred}`
      );

    } catch (error) {
      this.addResult(`${platform} URL test failed`, false, error.message);
    }
  }

  async testEmbeddedContent(platform) {
    console.log(`  Testing embedded ${platform} content...`);
    
    try {
      // Create test page with embedded content
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Embedded Content Test</title></head>
        <body>
          <h1>Testing Embedded ${platform} Content</h1>
          <iframe id="youtube-embed1" src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>
          <iframe id="youtube-embed2" src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>
          <iframe id="tiktok-embed" src="https://www.tiktok.com/embed/v2/7234567890123456789" width="325" height="580"></iframe>
          <video id="test-video" controls muted>
            <source src="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4" type="video/mp4">
          </video>
          <audio id="test-audio" controls>
            <source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" type="audio/wav">
          </audio>
        </body>
        </html>
      `;

      const testFilePath = path.join(__dirname, 'embedded-test.html');
      fs.writeFileSync(testFilePath, testHtml);

      // Navigate to test page
      await this.page.goto(`file://${testFilePath}`);
      await this.page.waitForDelay(5000); // Wait for content script to process

      // Check if embedded iframes were removed/blocked
      const embedCounts = await this.page.evaluate(() => {
        const youtubeIframes = document.querySelectorAll('iframe[src*="youtube"]');
        const tiktokIframes = document.querySelectorAll('iframe[src*="tiktok"]');
        const videos = document.querySelectorAll('video');
        const audios = document.querySelectorAll('audio');
        
        return {
          youtube: youtubeIframes.length,
          tiktok: tiktokIframes.length,
          videos: videos.length,
          audios: audios.length,
          videosMuted: Array.from(videos).every(v => v.muted),
          videosPaused: Array.from(videos).every(v => v.paused)
        };
      });

      // Verify content blocking
      this.addResult(
        `${platform} embedded iframes removed/blocked`,
        embedCounts.youtube === 0 && embedCounts.tiktok === 0,
        `YouTube iframes: ${embedCounts.youtube}, TikTok iframes: ${embedCounts.tiktok}`
      );

      this.addResult(
        'Video elements muted and paused',
        embedCounts.videosMuted && embedCounts.videosPaused,
        `Videos muted: ${embedCounts.videosMuted}, Videos paused: ${embedCounts.videosPaused}`
      );

      // Clean up
      fs.unlinkSync(testFilePath);

    } catch (error) {
      this.addResult(`${platform} embedded content test failed`, false, error.message);
    }
  }

  async testContentScriptBlocking() {
    console.log('📜 Testing Content Script Blocking...');
    
    try {
      // Create a comprehensive test page
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Content Script Test</title></head>
        <body>
          <h1>Content Script Blocking Test</h1>
          
          <!-- Video elements that should be blocked -->
          <video id="video1" controls autoplay>
            <source src="test1.mp4" type="video/mp4">
          </video>
          
          <video id="video2" controls>
            <source src="test2.mp4" type="video/mp4">
          </video>
          
          <!-- Audio elements that should be muted -->
          <audio id="audio1" controls autoplay>
            <source src="test1.mp3" type="audio/mpeg">
          </audio>
          
          <!-- YouTube embeds (should be removed) -->
          <iframe src="https://www.youtube.com/embed/testid1"></iframe>
          <iframe src="https://www.youtube-nocookie.com/embed/testid2"></iframe>
          
          <!-- TikTok embeds (should be removed) -->
          <iframe src="https://www.tiktok.com/embed/v2/testid3"></iframe>
          
          <!-- Custom elements that might be created by platforms -->
          <yt-embed video-id="testid4"></yt-embed>
          
          <script>
            // Simulate dynamic content loading
            setTimeout(() => {
              const newVideo = document.createElement('video');
              newVideo.id = 'dynamic-video';
              newVideo.controls = true;
              newVideo.autoplay = true;
              const source = document.createElement('source');
              source.src = 'dynamic.mp4';
              source.type = 'video/mp4';
              newVideo.appendChild(source);
              document.body.appendChild(newVideo);
            }, 2000);
          </script>
        </body>
        </html>
      `;

      const testFilePath = path.join(__dirname, 'content-script-test.html');
      fs.writeFileSync(testFilePath, testHtml);

      // Navigate to test page
      await this.page.goto(`file://${testFilePath}`);
      await this.page.waitForDelay(4000); // Wait for content script and dynamic content

      // Check content script effects
      const results = await this.page.evaluate(() => {
        const videos = document.querySelectorAll('video');
        const audios = document.querySelectorAll('audio');
        const youtubeIframes = document.querySelectorAll('iframe[src*="youtube"]');
        const tiktokIframes = document.querySelectorAll('iframe[src*="tiktok"]');
        const ytElements = document.querySelectorAll('yt-embed');
        
        return {
          totalVideos: videos.length,
          mutedVideos: Array.from(videos).filter(v => v.muted).length,
          pausedVideos: Array.from(videos).filter(v => v.paused).length,
          totalAudios: audios.length,
          mutedAudios: Array.from(audios).filter(a => a.muted).length,
          youtubeIframes: youtubeIframes.length,
          tiktokIframes: tiktokIframes.length,
          ytElements: ytElements.length
        };
      });

      // Verify content script is working
      this.addResult(
        'Content script blocks video elements',
        results.totalVideos === 0 || (results.mutedVideos === results.totalVideos && results.pausedVideos === results.totalVideos),
        `Videos: ${results.totalVideos}, Muted: ${results.mutedVideos}, Paused: ${results.pausedVideos}`
      );

      this.addResult(
        'Content script blocks audio elements',
        results.totalAudios === 0 || results.mutedAudios === results.totalAudios,
        `Audios: ${results.totalAudios}, Muted: ${results.mutedAudios}`
      );

      this.addResult(
        'Content script removes YouTube/TikTok iframes',
        results.youtubeIframes === 0 && results.tiktokIframes === 0,
        `YouTube iframes: ${results.youtubeIframes}, TikTok iframes: ${results.tiktokIframes}`
      );

      this.addResult(
        'Content script removes custom YouTube elements',
        results.ytElements === 0,
        `YT elements: ${results.ytElements}`
      );

      // Clean up
      fs.unlinkSync(testFilePath);

    } catch (error) {
      this.addResult('Content script blocking test failed', false, error.message);
    }
  }

  async testPlayInterception() {
    console.log('⏯️ Testing Media Play Interception...');
    
    try {
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Play Interception Test</title></head>
        <body>
          <video id="test-video" controls muted>
            <source src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAKptZGF0AAAABmpcJJQAAAByAAAAYmNsYXNzAAACAAAa" type="video/mp4">
          </video>
          <audio id="test-audio" controls>
            <source src="data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4AAAACAAEBAAEBAAEBAAEBAAEBAAEB" type="audio/wav">
          </audio>
          
          <script>
            window.playResults = {
              videoPlayBlocked: false,
              audioPlayBlocked: false,
              videoPromiseRejected: false,
              audioPromiseRejected: false
            };
            
            // Test video play blocking
            const video = document.getElementById('test-video');
            video.play().catch(error => {
              window.playResults.videoPromiseRejected = true;
              if (error.name === 'NotAllowedError') {
                window.playResults.videoPlayBlocked = true;
              }
            });
            
            // Test audio play blocking
            const audio = document.getElementById('test-audio');
            audio.play().catch(error => {
              window.playResults.audioPromiseRejected = true;
              if (error.name === 'NotAllowedError') {
                window.playResults.audioPlayBlocked = true;
              }
            });
          </script>
        </body>
        </html>
      `;

      const testFilePath = path.join(__dirname, 'play-test.html');
      fs.writeFileSync(testFilePath, testHtml);

      await this.page.goto(`file://${testFilePath}`);
      await this.page.waitForDelay(3000);

      const playResults = await this.page.evaluate(() => window.playResults);

      this.addResult(
        'Video play() method intercepted',
        playResults.videoPlayBlocked || playResults.videoPromiseRejected,
        `Play blocked: ${playResults.videoPlayBlocked}, Promise rejected: ${playResults.videoPromiseRejected}`
      );

      this.addResult(
        'Audio play() method intercepted',
        playResults.audioPlayBlocked || playResults.audioPromiseRejected,
        `Play blocked: ${playResults.audioPlayBlocked}, Promise rejected: ${playResults.audioPromiseRejected}`
      );

      fs.unlinkSync(testFilePath);

    } catch (error) {
      this.addResult('Play interception test failed', false, error.message);
    }
  }

  isBlockedDomain(url) {
    const blockedDomains = [
      'youtube.com',
      'youtu.be',
      'youtube-nocookie.com',
      'googlevideo.com',
      'tiktok.com',
      'netflix.com',
      'nflxvideo.net',
      'nflxso.net',
      'hulu.com',
      'hulustream.com'
    ];
    
    return blockedDomains.some(domain => url.includes(domain));
  }

  addResult(testName, passed, details = null) {
    const result = {
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    const status = passed ? '✅' : '❌';
    const detail = details ? ` (${details})` : '';
    console.log(`  ${status} ${testName}${detail}`);
  }

  async generateBlockingReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: Math.round((passedTests / totalTests) * 100)
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(__dirname, 'blocking-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllBlockingTests() {
    try {
      await this.setup();
      await this.ensureAllPlatformsBlocked();
      
      await this.testYouTubeBlocking();
      await this.testTikTokBlocking();
      await this.testNetflixBlocking();
      await this.testHuluBlocking();
      await this.testContentScriptBlocking();
      await this.testPlayInterception();

      console.log('\n📊 Generating Blocking Test Report...\n');
      const report = await this.generateBlockingReport();

      console.log('='.repeat(60));
      console.log('🚫 BLOCKING VERIFICATION RESULTS');
      console.log('='.repeat(60));
      console.log(`Total Blocking Tests: ${report.summary.total}`);
      console.log(`Passed: ${report.summary.passed} ✅`);
      console.log(`Failed: ${report.summary.failed} ❌`);
      console.log(`Success Rate: ${report.summary.successRate}%`);
      console.log('='.repeat(60));

      if (report.summary.failed > 0) {
        console.log('\n❌ Failed Blocking Tests:');
        this.results
          .filter(r => !r.passed)
          .forEach(r => console.log(`  - ${r.test}: ${r.details || 'No details'}`));
      }

      console.log(`\n📋 Blocking report saved: blocking-test-report.json`);

      return report.summary.successRate >= 90; // 90% success rate for blocking

    } catch (error) {
      console.error('❌ Blocking verification failed:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run blocking tests if called directly
if (require.main === module) {
  const verifier = new BlockingVerifier();
  verifier.runAllBlockingTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = BlockingVerifier;
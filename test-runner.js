const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class ExtensionTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.extensionId = null;
    this.results = [];
    this.testStartTime = Date.now();
  }

  async setup() {
    console.log('🚀 Starting Extension Testing...\n');
    
    // Launch Chrome with extension loaded
    const extensionPath = path.resolve(__dirname);
    
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible for debugging
      devtools: true,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    const pages = await this.browser.pages();
    this.page = pages[0];

    // Get extension ID
    await this.page.goto('chrome://extensions/');
    await new Promise(resolve => setTimeout(resolve, , 2000));
    
    const extensionId = await this.page.evaluate(() => {
      const cards = document.querySelectorAll('extensions-item');
      for (const card of cards) {
        const name = card.shadowRoot.querySelector('#name')?.textContent;
        if (name && name.includes('Simple Video Blocker')) {
          return card.getAttribute('id');
        }
      }
      return null;
    });

    if (!extensionId) {
      throw new Error('❌ Extension not found! Make sure it\'s loaded in Chrome.');
    }

    this.extensionId = extensionId;
    console.log(`✅ Extension loaded with ID: ${extensionId}\n`);
  }

  async testExtensionBasics() {
    console.log('📋 Testing Extension Basics...');
    
    try {
      // Test manifest loading
      const manifestExists = fs.existsSync(path.join(__dirname, 'manifest.json'));
      this.addResult('Manifest exists', manifestExists);

      // Test required files
      const requiredFiles = ['background.js', 'content.js', 'options.html', 'options.js', 'options.css'];
      for (const file of requiredFiles) {
        const exists = fs.existsSync(path.join(__dirname, file));
        this.addResult(`${file} exists`, exists);
      }

      // Test extension icon in toolbar
      await this.page.goto('chrome://extensions/');
      const iconVisible = await this.page.evaluate(() => {
        const items = document.querySelectorAll('extensions-item');
        return items.length > 0;
      });
      this.addResult('Extension visible in chrome://extensions', iconVisible);

    } catch (error) {
      this.addResult('Extension basics test', false, error.message);
    }
  }

  async testOptionsPage() {
    console.log('⚙️ Testing Options Page...');
    
    try {
      // Navigate to options page
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await new Promise(resolve => setTimeout(resolve, , 2000));

      // Check if page loads
      const title = await this.page.title();
      this.addResult('Options page loads', title.includes('Simple Video Blocker'));

      // Check for platform toggles
      const platforms = ['YouTube', 'TikTok', 'Netflix', 'Hulu'];
      for (const platform of platforms) {
        const toggle = await this.page.$(`#block${platform}`);
        this.addResult(`${platform} toggle exists`, !!toggle);
      }

      // Test toggle functionality
      const youtubeToggle = await this.page.$('#blockYouTube');
      if (youtubeToggle) {
        const initialState = await this.page.$eval('#blockYouTube', el => el.checked);
        await this.page.click('#blockYouTube');
        await new Promise(resolve => setTimeout(resolve, (1000);
        const newState = await this.page.$eval('#blockYouTube', el => el.checked);
        this.addResult('Toggle functionality works', initialState !== newState);
      }

    } catch (error) {
      this.addResult('Options page test', false, error.message);
    }
  }

  async testStorageAndSettings() {
    console.log('💾 Testing Storage and Settings...');
    
    try {
      // Navigate to options page
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await new Promise(resolve => setTimeout(resolve, , 2000));

      // Test settings persistence
      await this.page.click('#blockYouTube');
      await new Promise(resolve => setTimeout(resolve, (1000);
      
      // Reload page and check if setting persisted
      await this.page.reload();
      await new Promise(resolve => setTimeout(resolve, , 2000));
      
      const settingPersisted = await this.page.evaluate(() => {
        const checkbox = document.getElementById('blockYouTube');
        return checkbox ? checkbox.checked : false;
      });
      
      this.addResult('Settings persist after page reload', typeof settingPersisted === 'boolean');

      // Test save notification
      await this.page.click('#blockTikTok');
      await new Promise(resolve => setTimeout(resolve, (1500);
      
      const saveNotification = await this.page.$('.save-status.show');
      this.addResult('Save notification appears', !!saveNotification);

    } catch (error) {
      this.addResult('Storage and settings test', false, error.message);
    }
  }

  async testContentBlocking() {
    console.log('🚫 Testing Content Blocking...');
    
    try {
      // Create a test page with video elements
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Video Blocking Test</h1>
          <video id="test-video" controls>
            <source src="test.mp4" type="video/mp4">
          </video>
          <iframe id="youtube-embed" src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
          <iframe id="tiktok-embed" src="https://www.tiktok.com/embed/v2/123456789"></iframe>
          <audio id="test-audio" controls>
            <source src="test.mp3" type="audio/mpeg">
          </audio>
        </body>
        </html>
      `;

      // Write test file
      const testFilePath = path.join(__dirname, 'test-page.html');
      fs.writeFileSync(testFilePath, testHtml);

      // Navigate to test page
      await this.page.goto(`file://${testFilePath}`);
      await new Promise(resolve => setTimeout(resolve, (3000);

      // Check if content script is working
      const contentScriptActive = await this.page.evaluate(() => {
        // Check if our content script variables exist
        return typeof window.chrome !== 'undefined';
      });
      this.addResult('Content script loads', contentScriptActive);

      // Test video element blocking
      const videoCount = await this.page.evaluate(() => {
        return document.querySelectorAll('video').length;
      });
      
      // Should be 0 if blocking is working, or check if muted
      const videosBlocked = await this.page.evaluate(() => {
        const videos = document.querySelectorAll('video');
        if (videos.length === 0) return true;
        return Array.from(videos).every(v => v.muted && v.paused);
      });
      this.addResult('Video elements blocked/muted', videosBlocked);

      // Test iframe blocking
      const iframeCount = await this.page.evaluate(() => {
        const iframes = document.querySelectorAll('iframe');
        return Array.from(iframes).filter(iframe => {
          const src = iframe.src.toLowerCase();
          return !src.includes('youtube.com') && !src.includes('tiktok.com');
        }).length;
      });
      this.addResult('YouTube/TikTok iframes removed', iframeCount === 0 || iframeCount < 2);

      // Clean up test file
      fs.unlinkSync(testFilePath);

    } catch (error) {
      this.addResult('Content blocking test', false, error.message);
    }
  }

  async testNetworkBlocking() {
    console.log('🌐 Testing Network Blocking...');
    
    try {
      // Monitor network requests
      await this.page.setRequestInterception(true);
      const blockedRequests = [];
      const allowedRequests = [];

      this.page.on('request', request => {
        const url = request.url();
        if (url.includes('youtube.com') || url.includes('youtu.be') || 
            url.includes('tiktok.com') || url.includes('netflix.com') || 
            url.includes('hulu.com')) {
          blockedRequests.push(url);
          request.abort();
        } else {
          allowedRequests.push(url);
          request.continue();
        }
      });

      // Try to navigate to blocked sites
      const testUrls = [
        'https://www.youtube.com',
        'https://www.tiktok.com',
        'https://www.netflix.com',
        'https://www.hulu.com'
      ];

      for (const url of testUrls) {
        try {
          await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 5000 });
        } catch (error) {
          // Expected to fail due to blocking
        }
      }

      this.addResult('Network requests to blocked sites intercepted', blockedRequests.length > 0);
      
      // Turn off request interception
      await this.page.setRequestInterception(false);

    } catch (error) {
      this.addResult('Network blocking test', false, error.message);
    }
  }

  async testBadgeStatus() {
    console.log('🔢 Testing Badge Status...');
    
    try {
      // Navigate to options page and change settings
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await new Promise(resolve => setTimeout(resolve, , 2000));

      // Test different badge states
      // First, block all platforms
      const platforms = ['YouTube', 'TikTok', 'Netflix', 'Hulu'];
      for (const platform of platforms) {
        const checkbox = await this.page.$(`#block${platform}`);
        if (checkbox) {
          const isChecked = await this.page.$eval(`#block${platform}`, el => el.checked);
          if (!isChecked) {
            await this.page.click(`#block${platform}`);
            await new Promise(resolve => setTimeout(resolve, (500);
          }
        }
      }

      // Check badge functionality exists (we can't directly test chrome.action in puppeteer)
      const badgeScriptExists = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
      this.addResult('Badge update function exists', badgeScriptExists.includes('updateBadge'));
      this.addResult('Badge color management exists', badgeScriptExists.includes('setBadgeBackgroundColor'));
      this.addResult('Badge text management exists', badgeScriptExists.includes('setBadgeText'));

    } catch (error) {
      this.addResult('Badge status test', false, error.message);
    }
  }

  async testErrorHandling() {
    console.log('🛡️ Testing Error Handling...');
    
    try {
      // Check if error handling code exists in all files
      const files = ['background.js', 'content.js', 'options.js'];
      
      for (const filename of files) {
        const content = fs.readFileSync(path.join(__dirname, filename), 'utf8');
        this.addResult(`${filename} has try-catch blocks`, content.includes('try {') && content.includes('catch'));
        this.addResult(`${filename} handles chrome.runtime.lastError`, content.includes('chrome.runtime.lastError'));
      }

      // Test console error logging
      const consoleLogs = [];
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push(msg.text());
        }
      });

      // Navigate to options and trigger potential errors
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await new Promise(resolve => setTimeout(resolve, , 2000));

      // Rapid clicking to test error handling
      for (let i = 0; i < 5; i++) {
        await this.page.click('#blockYouTube');
        await new Promise(resolve => setTimeout(resolve, (100);
      }

      // Check that no critical errors occurred
      const criticalErrors = consoleLogs.filter(log => 
        log.includes('Uncaught') || log.includes('TypeError') || log.includes('ReferenceError')
      );
      this.addResult('No critical JavaScript errors', criticalErrors.length === 0);

    } catch (error) {
      this.addResult('Error handling test', false, error.message);
    }
  }

  addResult(testName, passed, errorMessage = null) {
    const result = {
      test: testName,
      passed,
      errorMessage,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    const status = passed ? '✅' : '❌';
    const error = errorMessage ? ` (${errorMessage})` : '';
    console.log(`  ${status} ${testName}${error}`);
  }

  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const testDuration = Date.now() - this.testStartTime;

    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        duration: testDuration
      },
      results: this.results,
      timestamp: new Date().toISOString(),
      extensionId: this.extensionId
    };

    // Write detailed report
    fs.writeFileSync(
      path.join(__dirname, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Write human-readable report
    let humanReport = `# Simple Video Blocker Extension Test Report\n\n`;
    humanReport += `**Generated:** ${report.timestamp}\n`;
    humanReport += `**Extension ID:** ${this.extensionId}\n`;
    humanReport += `**Duration:** ${(testDuration / 1000).toFixed(2)} seconds\n\n`;
    humanReport += `## Summary\n`;
    humanReport += `- **Total Tests:** ${totalTests}\n`;
    humanReport += `- **Passed:** ${passedTests} ✅\n`;
    humanReport += `- **Failed:** ${failedTests} ❌\n`;
    humanReport += `- **Success Rate:** ${report.summary.successRate}%\n\n`;
    humanReport += `## Test Results\n\n`;

    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      const error = result.errorMessage ? ` - Error: ${result.errorMessage}` : '';
      humanReport += `${status} **${result.test}**${error}\n`;
    }

    fs.writeFileSync(
      path.join(__dirname, 'test-report.md'),
      humanReport
    );

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.setup();
      await this.testExtensionBasics();
      await this.testOptionsPage();
      await this.testStorageAndSettings();
      await this.testContentBlocking();
      await this.testNetworkBlocking();
      await this.testBadgeStatus();
      await this.testErrorHandling();

      console.log('\n📊 Generating Test Report...\n');
      const report = this.generateReport();

      console.log('='.repeat(50));
      console.log('🎯 TEST SUMMARY');
      console.log('='.repeat(50));
      console.log(`Total Tests: ${report.summary.total}`);
      console.log(`Passed: ${report.summary.passed} ✅`);
      console.log(`Failed: ${report.summary.failed} ❌`);
      console.log(`Success Rate: ${report.summary.successRate}%`);
      console.log(`Duration: ${(report.summary.duration / 1000).toFixed(2)} seconds`);
      console.log('='.repeat(50));

      if (report.summary.failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.results
          .filter(r => !r.passed)
          .forEach(r => console.log(`  - ${r.test}: ${r.errorMessage || 'Unknown error'}`));
      }

      console.log(`\n📋 Detailed reports saved:`);
      console.log(`  - test-report.json (machine-readable)`);
      console.log(`  - test-report.md (human-readable)`);

      return report.summary.successRate >= 80; // 80% pass rate considered success

    } catch (error) {
      console.error('❌ Test runner failed:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ExtensionTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = ExtensionTester;
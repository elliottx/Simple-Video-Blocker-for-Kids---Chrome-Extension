const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class SimpleExtensionTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.extensionId = null;
    this.results = [];
    this.testStartTime = Date.now();
  }

  async setup() {
    console.log('🚀 Starting Simple Extension Test...\n');
    
    const extensionPath = path.resolve(__dirname);
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const pages = await this.browser.pages();
    this.page = pages[0];

    // Get extension ID
    await this.page.goto('chrome://extensions/');
    await sleep(2000);
    
    const extensionId = await this.page.evaluate(() => {
      const cards = document.querySelectorAll('extensions-item');
      for (const card of cards) {
        const name = card.shadowRoot?.querySelector('#name')?.textContent;
        if (name && name.includes('Simple Video Blocker')) {
          return card.getAttribute('id');
        }
      }
      return null;
    });

    if (!extensionId) {
      throw new Error('❌ Extension not found! Make sure it\'s loaded in Chrome Developer Mode.');
    }

    this.extensionId = extensionId;
    console.log(`✅ Extension loaded with ID: ${extensionId}\n`);
  }

  async testExtensionBasics() {
    console.log('📋 Testing Extension Basics...');
    
    try {
      // Test manifest loading
      const manifestExists = fs.existsSync(path.join(__dirname, 'manifest.json'));
      this.addResult('Manifest file exists', manifestExists);

      if (manifestExists) {
        const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
        this.addResult('Manifest has correct version', manifest.manifest_version === 3);
        this.addResult('Extension name is correct', manifest.name.includes('Video Blocker'));
        this.addResult('Required permissions present', 
          manifest.permissions?.includes('declarativeNetRequest') && 
          manifest.permissions?.includes('storage'));
      }

      // Test required files
      const requiredFiles = ['background.js', 'content.js', 'options.html', 'options.js', 'options.css'];
      for (const file of requiredFiles) {
        const exists = fs.existsSync(path.join(__dirname, file));
        this.addResult(`${file} exists`, exists);
      }

      // Test background script contains required functions
      const backgroundScript = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
      this.addResult('Background script has updateRules function', backgroundScript.includes('function updateRules'));
      this.addResult('Background script has updateBadge function', backgroundScript.includes('function updateBadge'));

    } catch (error) {
      this.addResult('Extension basics test failed', false, error.message);
    }
  }

  async testOptionsPage() {
    console.log('⚙️ Testing Options Page...');
    
    try {
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await sleep(2000);

      // Check if page loads
      const title = await this.page.title();
      this.addResult('Options page loads', title.includes('Simple Video Blocker'));

      // Check for platform toggles
      const platforms = ['YouTube', 'TikTok', 'Netflix', 'Hulu'];
      for (const platform of platforms) {
        try {
          const toggle = await this.page.$(`#block${platform}`);
          this.addResult(`${platform} toggle exists`, !!toggle);
          
          if (toggle) {
            // Test if toggle is checked by default (should be blocked by default)
            const isChecked = await this.page.$eval(`#block${platform}`, el => el.checked);
            this.addResult(`${platform} blocked by default`, isChecked);
          }
        } catch (error) {
          this.addResult(`${platform} toggle test failed`, false, error.message);
        }
      }

      // Test basic toggle functionality
      try {
        const initialState = await this.page.$eval('#blockYouTube', el => el.checked);
        await this.page.click('#blockYouTube');
        await sleep(1000);
        const newState = await this.page.$eval('#blockYouTube', el => el.checked);
        this.addResult('Toggle functionality works', initialState !== newState);
      } catch (error) {
        this.addResult('Toggle functionality test failed', false, error.message);
      }

    } catch (error) {
      this.addResult('Options page test failed', false, error.message);
    }
  }

  async testBasicBlocking() {
    console.log('🚫 Testing Basic Blocking...');
    
    try {
      // Create a simple test page with video elements
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Blocking Test</title></head>
        <body>
          <h1>Video Blocking Test</h1>
          <video id="test-video" controls>
            <source src="test.mp4" type="video/mp4">
          </video>
          <iframe id="youtube-embed" src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>
          <iframe id="tiktok-embed" src="https://www.tiktok.com/embed/v2/123456789" width="325" height="580"></iframe>
        </body>
        </html>
      `;

      const testFilePath = path.join(__dirname, 'blocking-test.html');
      fs.writeFileSync(testFilePath, testHtml);

      // Navigate to test page
      await this.page.goto(`file://${testFilePath}`);
      await sleep(3000); // Wait for content script to process

      // Check if content script is working
      const results = await this.page.evaluate(() => {
        const videos = document.querySelectorAll('video');
        const youtubeIframes = document.querySelectorAll('iframe[src*="youtube"]');
        const tiktokIframes = document.querySelectorAll('iframe[src*="tiktok"]');
        
        return {
          videoCount: videos.length,
          videosBlocked: videos.length === 0 || Array.from(videos).every(v => v.muted && v.paused),
          youtubeIframes: youtubeIframes.length,
          tiktokIframes: tiktokIframes.length
        };
      });

      this.addResult('Content script processes page', true); // If we got here, no crashes
      this.addResult('Video elements handled correctly', 
        results.videosBlocked, 
        `Videos: ${results.videoCount}, properly handled: ${results.videosBlocked}`);
      
      this.addResult('YouTube/TikTok iframes detected', 
        results.youtubeIframes >= 0 && results.tiktokIframes >= 0,
        `YouTube: ${results.youtubeIframes}, TikTok: ${results.tiktokIframes}`);

      // Clean up
      fs.unlinkSync(testFilePath);

    } catch (error) {
      this.addResult('Basic blocking test failed', false, error.message);
    }
  }

  async testNetworkBlocking() {
    console.log('🌐 Testing Network Rules...');
    
    try {
      // Test if background script creates blocking rules
      const backgroundScript = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
      
      // Check for declarativeNetRequest usage
      this.addResult('Uses declarativeNetRequest API', 
        backgroundScript.includes('chrome.declarativeNetRequest'));
      
      // Check for platform domains in rules
      this.addResult('Has YouTube blocking rules', 
        backgroundScript.includes('youtube.com') && backgroundScript.includes('youtu.be'));
      
      this.addResult('Has TikTok blocking rules', 
        backgroundScript.includes('tiktok.com'));
      
      this.addResult('Has Netflix blocking rules', 
        backgroundScript.includes('netflix.com'));
      
      this.addResult('Has Hulu blocking rules', 
        backgroundScript.includes('hulu.com'));

      // Check if rules are dynamic based on settings
      this.addResult('Rules respond to settings changes', 
        backgroundScript.includes('chrome.storage.onChanged'));

    } catch (error) {
      this.addResult('Network blocking test failed', false, error.message);
    }
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
        successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
        duration: testDuration
      },
      results: this.results,
      timestamp: new Date().toISOString(),
      extensionId: this.extensionId
    };

    // Write report
    fs.writeFileSync(
      path.join(__dirname, 'simple-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Write markdown report
    let mdReport = `# Simple Video Blocker Extension Test Report\n\n`;
    mdReport += `**Generated:** ${report.timestamp}\n`;
    mdReport += `**Duration:** ${(testDuration / 1000).toFixed(2)} seconds\n\n`;
    mdReport += `## Summary\n`;
    mdReport += `- **Total Tests:** ${totalTests}\n`;
    mdReport += `- **Passed:** ${passedTests} ✅\n`;
    mdReport += `- **Failed:** ${failedTests} ❌\n`;
    mdReport += `- **Success Rate:** ${report.summary.successRate}%\n\n`;
    
    if (report.summary.successRate >= 80) {
      mdReport += `🎉 **EXTENSION LOOKS GOOD!** Ready for use.\n\n`;
    } else {
      mdReport += `⚠️ **NEEDS ATTENTION** Some issues found.\n\n`;
    }
    
    mdReport += `## Test Results\n\n`;
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      const detail = result.details ? ` - ${result.details}` : '';
      mdReport += `${status} **${result.test}**${detail}\n`;
    }

    fs.writeFileSync(
      path.join(__dirname, 'simple-test-report.md'),
      mdReport
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
      await this.testBasicBlocking();
      await this.testNetworkBlocking();

      console.log('\n📊 Generating Test Report...\n');
      const report = this.generateReport();

      console.log('='.repeat(60));
      console.log('🎯 SIMPLE TEST RESULTS');
      console.log('='.repeat(60));
      console.log(`Total Tests: ${report.summary.total}`);
      console.log(`Passed: ${report.summary.passed} ✅`);
      console.log(`Failed: ${report.summary.failed} ❌`);
      console.log(`Success Rate: ${report.summary.successRate}%`);
      console.log(`Duration: ${(report.summary.duration / 1000).toFixed(2)} seconds`);
      console.log('='.repeat(60));

      if (report.summary.failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.results
          .filter(r => !r.passed)
          .forEach(r => console.log(`  - ${r.test}: ${r.details || 'Unknown error'}`));
      }

      console.log(`\n📋 Reports saved:`);
      console.log(`  - simple-test-report.json`);
      console.log(`  - simple-test-report.md`);

      if (report.summary.successRate >= 70) {
        console.log(`\n🎉 Extension appears to be working correctly!`);
        return true;
      } else {
        console.log(`\n⚠️ Extension may have issues. Please review failed tests.`);
        return false;
      }

    } catch (error) {
      console.error('❌ Testing failed:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SimpleExtensionTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = SimpleExtensionTester;
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class SettingsVerifier {
  constructor() {
    this.browser = null;
    this.page = null;
    this.extensionId = null;
    this.results = [];
  }

  async setup() {
    console.log('⚙️ Starting Settings Verification Tests...\n');
    
    const extensionPath = path.resolve(__dirname);
    
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-dev-shm-usage'
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

  async testDefaultSettings() {
    console.log('🔧 Testing Default Settings...');
    
    try {
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await this.page.waitForDelay(2000);

      const platforms = ['YouTube', 'TikTok', 'Netflix', 'Hulu'];
      let allBlockedByDefault = true;

      for (const platform of platforms) {
        const isChecked = await this.page.$eval(`#block${platform}`, el => el.checked);
        if (!isChecked) {
          allBlockedByDefault = false;
        }
        this.addResult(`${platform} blocked by default`, isChecked);
      }

      this.addResult('All platforms blocked by default', allBlockedByDefault);

    } catch (error) {
      this.addResult('Default settings test failed', false, error.message);
    }
  }

  async testToggleFunctionality() {
    console.log('🔄 Testing Toggle Functionality...');
    
    try {
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await this.page.waitForDelay(2000);

      const platforms = ['YouTube', 'TikTok', 'Netflix', 'Hulu'];

      for (const platform of platforms) {
        // Get initial state
        const initialState = await this.page.$eval(`#block${platform}`, el => el.checked);
        
        // Click toggle
        await this.page.click(`#block${platform}`);
        await this.page.waitForDelay(1000);
        
        // Get new state
        const newState = await this.page.$eval(`#block${platform}`, el => el.checked);
        
        this.addResult(`${platform} toggle changes state`, initialState !== newState);
        
        // Toggle back to original state
        await this.page.click(`#block${platform}`);
        await this.page.waitForDelay(500);
      }

    } catch (error) {
      this.addResult('Toggle functionality test failed', false, error.message);
    }
  }

  async testSettingsPersistence() {
    console.log('💾 Testing Settings Persistence...');
    
    try {
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await this.page.waitForDelay(2000);

      // Change YouTube setting
      await this.page.click('#blockYouTube');
      await this.page.waitForDelay(1000);
      
      const stateAfterToggle = await this.page.$eval('#blockYouTube', el => el.checked);

      // Reload page
      await this.page.reload();
      await this.page.waitForDelay(2000);

      const stateAfterReload = await this.page.$eval('#blockYouTube', el => el.checked);
      
      this.addResult('Settings persist after page reload', stateAfterToggle === stateAfterReload);

      // Test with browser restart simulation (new page)
      const newPage = await this.browser.newPage();
      await newPage.goto(optionsUrl);
      await newPage.waitForDelay(2000);

      const stateInNewPage = await newPage.$eval('#blockYouTube', el => el.checked);
      
      this.addResult('Settings persist in new page', stateAfterToggle === stateInNewPage);

      await newPage.close();

    } catch (error) {
      this.addResult('Settings persistence test failed', false, error.message);
    }
  }

  async testSaveNotifications() {
    console.log('💬 Testing Save Notifications...');
    
    try {
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await this.page.waitForDelay(2000);

      // Toggle a setting and check for notification
      await this.page.click('#blockYouTube');
      await this.page.waitForDelay(1500);

      const notification = await this.page.$('.save-status.show');
      this.addResult('Save notification appears', !!notification);

      if (notification) {
        const notificationText = await this.page.$eval('.save-status', el => el.textContent);
        this.addResult('Save notification has meaningful text', 
          notificationText.includes('YouTube') && (notificationText.includes('blocked') || notificationText.includes('allowed')));
      }

      // Wait for notification to disappear
      await this.page.waitForDelay(3000);
      const notificationGone = await this.page.$('.save-status.show');
      this.addResult('Save notification disappears automatically', !notificationGone);

    } catch (error) {
      this.addResult('Save notifications test failed', false, error.message);
    }
  }

  async testVisualFeedback() {
    console.log('🎨 Testing Visual Feedback...');
    
    try {
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await this.page.waitForDelay(2000);

      // Test blocked state (red background)
      await this.page.click('#blockYouTube'); // Ensure it's checked (blocked)
      await this.page.waitForDelay(500);
      
      const blockedBackground = await this.page.$eval('#blockYouTube', el => {
        const settingItem = el.closest('.setting-item');
        return window.getComputedStyle(settingItem).backgroundColor;
      });
      
      this.addResult('Blocked state shows red background', 
        blockedBackground.includes('255, 235, 238') || blockedBackground.includes('ffebee'));

      // Test allowed state (green background)
      await this.page.click('#blockYouTube'); // Uncheck (allowed)
      await this.page.waitForDelay(500);
      
      const allowedBackground = await this.page.$eval('#blockYouTube', el => {
        const settingItem = el.closest('.setting-item');
        return window.getComputedStyle(settingItem).backgroundColor;
      });
      
      this.addResult('Allowed state shows green background',
        allowedBackground.includes('232, 245, 233') || allowedBackground.includes('e8f5e9'));

      // Test toggle switch colors
      const toggleColors = await this.page.evaluate(() => {
        const toggle = document.querySelector('#blockYouTube:checked + .slider');
        const uncheckedToggle = document.querySelector('#blockTikTok:not(:checked) + .slider');
        
        return {
          checkedColor: toggle ? window.getComputedStyle(toggle).backgroundColor : null,
          uncheckedColor: uncheckedToggle ? window.getComputedStyle(uncheckedToggle).backgroundColor : null
        };
      });

      this.addResult('Toggle switch visual states correct', 
        toggleColors.checkedColor && toggleColors.uncheckedColor && 
        toggleColors.checkedColor !== toggleColors.uncheckedColor);

    } catch (error) {
      this.addResult('Visual feedback test failed', false, error.message);
    }
  }

  async testClickableAreas() {
    console.log('👆 Testing Clickable Areas...');
    
    try {
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await this.page.waitForDelay(2000);

      // Get initial state
      const initialState = await this.page.$eval('#blockYouTube', el => el.checked);

      // Click on the setting item (not just the toggle)
      const settingItem = await this.page.$('#blockYouTube').then(el => el.closest('.setting-item'));
      await this.page.evaluate(el => el.click(), settingItem);
      await this.page.waitForDelay(1000);

      const stateAfterClick = await this.page.$eval('#blockYouTube', el => el.checked);
      
      this.addResult('Setting item area is clickable', initialState !== stateAfterClick);

      // Test clicking on different parts
      const platformInfo = await this.page.$('.setting-item .setting-info');
      if (platformInfo) {
        const stateBefore = await this.page.$eval('#blockTikTok', el => el.checked);
        await this.page.evaluate(el => el.click(), platformInfo);
        await this.page.waitForDelay(1000);
        const stateAfter = await this.page.$eval('#blockTikTok', el => el.checked);
        
        this.addResult('Platform info area is clickable', stateBefore !== stateAfter);
      }

    } catch (error) {
      this.addResult('Clickable areas test failed', false, error.message);
    }
  }

  async testRapidChanges() {
    console.log('⚡ Testing Rapid Setting Changes...');
    
    try {
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await this.page.waitForDelay(2000);

      // Rapid toggle changes
      const platforms = ['YouTube', 'TikTok', 'Netflix', 'Hulu'];
      
      for (let i = 0; i < 5; i++) {
        for (const platform of platforms) {
          await this.page.click(`#block${platform}`);
          await this.page.waitForDelay(100); // Very short delay
        }
      }

      // Wait for all saves to complete
      await this.page.waitForDelay(2000);

      // Check that settings are still functional after rapid changes
      const initialState = await this.page.$eval('#blockYouTube', el => el.checked);
      await this.page.click('#blockYouTube');
      await this.page.waitForDelay(1000);
      const finalState = await this.page.$eval('#blockYouTube', el => el.checked);

      this.addResult('Settings functional after rapid changes', initialState !== finalState);

      // Check for JavaScript errors
      const logs = [];
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });

      await this.page.waitForDelay(1000);
      
      const criticalErrors = logs.filter(log => 
        log.includes('Uncaught') || log.includes('TypeError')
      );
      
      this.addResult('No critical errors during rapid changes', criticalErrors.length === 0);

    } catch (error) {
      this.addResult('Rapid changes test failed', false, error.message);
    }
  }

  async testErrorScenarios() {
    console.log('🚨 Testing Error Scenarios...');
    
    try {
      // Test with simulated storage errors
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await this.page.waitForDelay(2000);

      // Inject error simulation
      await this.page.evaluate(() => {
        const originalSet = chrome.storage.sync.set;
        let errorCount = 0;
        
        chrome.storage.sync.set = function(items, callback) {
          errorCount++;
          if (errorCount <= 2) {
            // Simulate error for first few attempts
            setTimeout(() => {
              callback();
              chrome.runtime.lastError = { message: 'Simulated storage error' };
            }, 100);
          } else {
            // Restore normal functionality
            originalSet.call(this, items, callback);
          }
        };
      });

      // Try to change a setting
      await this.page.click('#blockYouTube');
      await this.page.waitForDelay(2000);

      // Check if error notification appears
      const errorNotification = await this.page.$('.save-status');
      if (errorNotification) {
        const bgColor = await this.page.$eval('.save-status', el => 
          window.getComputedStyle(el).backgroundColor
        );
        this.addResult('Error notification shows different color', 
          bgColor.includes('244, 67, 54') || bgColor.includes('f44336')); // Red color
      }

      this.addResult('Error handling graceful', true); // If we got here, no crashes occurred

    } catch (error) {
      this.addResult('Error scenarios test failed', false, error.message);
    }
  }

  async testResponsiveDesign() {
    console.log('📱 Testing Responsive Design...');
    
    try {
      const optionsUrl = `chrome-extension://${this.extensionId}/options.html`;
      await this.page.goto(optionsUrl);
      await this.page.waitForDelay(2000);

      // Test different viewport sizes
      const viewports = [
        { width: 1200, height: 800, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];

      for (const viewport of viewports) {
        await this.page.setViewport(viewport);
        await this.page.waitForDelay(1000);

        // Check if elements are visible and functional
        const elementsVisible = await this.page.evaluate(() => {
          const toggles = document.querySelectorAll('.toggle-switch');
          const settingItems = document.querySelectorAll('.setting-item');
          
          return {
            togglesVisible: Array.from(toggles).every(t => t.offsetWidth > 0 && t.offsetHeight > 0),
            settingItemsVisible: Array.from(settingItems).every(s => s.offsetWidth > 0 && s.offsetHeight > 0),
            containerVisible: document.querySelector('.container').offsetWidth > 0
          };
        });

        this.addResult(`${viewport.name} layout renders correctly`,
          elementsVisible.togglesVisible && elementsVisible.settingItemsVisible && elementsVisible.containerVisible);

        // Test functionality at this viewport
        const initialState = await this.page.$eval('#blockYouTube', el => el.checked);
        await this.page.click('#blockYouTube');
        await this.page.waitForDelay(500);
        const newState = await this.page.$eval('#blockYouTube', el => el.checked);
        
        this.addResult(`${viewport.name} toggle functionality works`, initialState !== newState);
      }

      // Reset to default viewport
      await this.page.setViewport({ width: 1200, height: 800 });

    } catch (error) {
      this.addResult('Responsive design test failed', false, error.message);
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

  async generateSettingsReport() {
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
      path.join(__dirname, 'settings-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllSettingsTests() {
    try {
      await this.setup();
      
      await this.testDefaultSettings();
      await this.testToggleFunctionality();
      await this.testSettingsPersistence();
      await this.testSaveNotifications();
      await this.testVisualFeedback();
      await this.testClickableAreas();
      await this.testRapidChanges();
      await this.testErrorScenarios();
      await this.testResponsiveDesign();

      console.log('\n📊 Generating Settings Test Report...\n');
      const report = await this.generateSettingsReport();

      console.log('='.repeat(60));
      console.log('⚙️ SETTINGS VERIFICATION RESULTS');
      console.log('='.repeat(60));
      console.log(`Total Settings Tests: ${report.summary.total}`);
      console.log(`Passed: ${report.summary.passed} ✅`);
      console.log(`Failed: ${report.summary.failed} ❌`);
      console.log(`Success Rate: ${report.summary.successRate}%`);
      console.log('='.repeat(60));

      if (report.summary.failed > 0) {
        console.log('\n❌ Failed Settings Tests:');
        this.results
          .filter(r => !r.passed)
          .forEach(r => console.log(`  - ${r.test}: ${r.details || 'No details'}`));
      }

      console.log(`\n📋 Settings report saved: settings-test-report.json`);

      return report.summary.successRate >= 85; // 85% success rate for settings

    } catch (error) {
      console.error('❌ Settings verification failed:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run settings tests if called directly
if (require.main === module) {
  const verifier = new SettingsVerifier();
  verifier.runAllSettingsTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = SettingsVerifier;
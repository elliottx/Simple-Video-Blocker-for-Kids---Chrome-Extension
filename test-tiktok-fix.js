const fs = require('fs');
const path = require('path');

class TikTokFixValidator {
  constructor() {
    this.results = [];
  }

  addResult(test, passed, details = '') {
    this.results.push({ test, passed, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}${details ? ' - ' + details : ''}`);
  }

  validateFixes() {
    console.log('🔧 Validating TikTok Fixes...\n');

    try {
      // Check background script has enhanced TikTok domains
      const backgroundScript = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
      
      const tiktokDomains = [
        'tiktok.com',
        'vm.tiktok.com', 
        'vt.tiktok.com',
        'tiktokv.com',
        'tiktokcdn.com',
        'musical.ly'
      ];

      let domainsFound = 0;
      tiktokDomains.forEach(domain => {
        if (backgroundScript.includes(domain)) {
          domainsFound++;
          this.addResult(`Background script covers ${domain}`, true);
        } else {
          this.addResult(`Background script missing ${domain}`, false);
        }
      });

      this.addResult('Enhanced TikTok domain coverage', domainsFound >= 4, `${domainsFound}/6 domains`);

      // Check content script updates
      const contentScript = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
      
      const hasMusicalLy = contentScript.includes('musical.ly');
      this.addResult('Content script covers musical.ly', hasMusicalLy);

      const iframeRemovalFixed = contentScript.includes('src.includes(\'tiktok.com\') || src.includes(\'musical.ly\')');
      this.addResult('Iframe removal handles multiple TikTok domains', iframeRemovalFixed);

      // Check rule structure
      const ruleCount = (backgroundScript.match(/createRule\(/g) || []).length;
      this.addResult('Total blocking rules created', ruleCount >= 12, `${ruleCount} rules found`);

    } catch (error) {
      this.addResult('Fix validation failed', false, error.message);
    }
  }

  generateTestInstructions() {
    console.log('\n📋 Testing Instructions...\n');
    console.log('To test the TikTok fixes:');
    console.log('');
    console.log('1. 🔄 RELOAD THE EXTENSION:');
    console.log('   • Go to chrome://extensions/');
    console.log('   • Find "Simple Video Blocker for Kids"');  
    console.log('   • Click the reload button (🔄) on the extension');
    console.log('');
    console.log('2. ✅ SET TIKTOK TO ALLOWED:');
    console.log('   • Click the extension icon');
    console.log('   • Toggle TikTok to "ALLOWED" (switch should be off/green)');
    console.log('   • Verify you see "TikTok allowed" notification');
    console.log('');
    console.log('3. 🧹 CLEAR BROWSER CACHE:');
    console.log('   • Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)');
    console.log('   • Select "All time" and check "Cached images and files"');
    console.log('   • Click "Clear data"');
    console.log('');
    console.log('4. 🔍 TEST TIKTOK ACCESS:');
    console.log('   • Open a new incognito window (Ctrl+Shift+N)');
    console.log('   • Go to https://www.tiktok.com');
    console.log('   • Try accessing TikTok content');
    console.log('   • Check if videos play normally');
    console.log('');
    console.log('5. 🕵️ TROUBLESHOOTING:');
    console.log('   • Open DevTools (F12) and check Console tab for errors');
    console.log('   • Look for blocked network requests in Network tab');
    console.log('   • Try different TikTok URLs:');
    console.log('     - https://www.tiktok.com/@username');
    console.log('     - https://vm.tiktok.com/shortcode/');
    console.log('');
    console.log('6. ⚡ IF STILL NOT WORKING:');
    console.log('   • Disable the extension completely');
    console.log('   • Test if TikTok works without extension');
    console.log('   • Re-enable extension to confirm blocking works');
    console.log('   • Check if your network/ISP blocks TikTok');
  }

  runValidation() {
    console.log('🩺 TikTok Fix Validation\n');
    console.log('='.repeat(60));

    this.validateFixes();

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n📊 VALIDATION RESULTS');
    console.log('='.repeat(30));
    console.log(`Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${totalTests - passedTests} ❌`);
    console.log(`Success Rate: ${successRate}%`);

    if (successRate >= 80) {
      console.log('\n🎉 FIXES LOOK GOOD!');
      console.log('The TikTok domain coverage has been enhanced.');
      this.generateTestInstructions();
    } else {
      console.log('\n⚠️ ISSUES FOUND');
      console.log('Some fixes may not have been applied correctly.');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`❌ ${result.test}: ${result.details}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    return successRate >= 80;
  }
}

if (require.main === module) {
  const validator = new TikTokFixValidator();
  validator.runValidation();
}

module.exports = TikTokFixValidator;
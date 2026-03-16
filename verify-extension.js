const fs = require('fs');
const path = require('path');

class ExtensionVerifier {
  constructor() {
    this.results = [];
    this.projectPath = __dirname;
  }

  addResult(testName, passed, details = null) {
    const result = { test: testName, passed, details };
    this.results.push(result);
    const status = passed ? '✅' : '❌';
    const detail = details ? ` (${details})` : '';
    console.log(`${status} ${testName}${detail}`);
  }

  verifyFileStructure() {
    console.log('📂 Verifying File Structure...\n');
    
    const requiredFiles = [
      'manifest.json',
      'background.js', 
      'content.js',
      'options.html',
      'options.js',
      'options.css',
      'icon.png'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectPath, file);
      const exists = fs.existsSync(filePath);
      this.addResult(`${file} exists`, exists);
      
      if (exists) {
        const stats = fs.statSync(filePath);
        this.addResult(`${file} has content`, stats.size > 0, `${stats.size} bytes`);
      }
    }
  }

  verifyManifest() {
    console.log('\n📋 Verifying Manifest...\n');
    
    try {
      const manifestPath = path.join(this.projectPath, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      this.addResult('Manifest is valid JSON', true);
      this.addResult('Manifest version 3', manifest.manifest_version === 3);
      this.addResult('Extension name set', !!manifest.name, manifest.name);
      this.addResult('Version specified', !!manifest.version, manifest.version);
      
      // Check permissions
      const requiredPerms = ['declarativeNetRequest', 'storage', 'tabs'];
      for (const perm of requiredPerms) {
        const hasPermission = manifest.permissions?.includes(perm);
        this.addResult(`Permission: ${perm}`, hasPermission);
      }
      
      // Check components
      this.addResult('Background script defined', !!manifest.background);
      this.addResult('Content scripts defined', !!manifest.content_scripts);
      this.addResult('Options page defined', !!manifest.options_page);
      this.addResult('Action defined', !!manifest.action);
      
    } catch (error) {
      this.addResult('Manifest verification failed', false, error.message);
    }
  }

  verifyBackgroundScript() {
    console.log('\n⚙️ Verifying Background Script...\n');
    
    try {
      const scriptPath = path.join(this.projectPath, 'background.js');
      const script = fs.readFileSync(scriptPath, 'utf8');
      
      // Check for required functions
      this.addResult('Has updateRules function', script.includes('function updateRules'));
      this.addResult('Has updateBadge function', script.includes('function updateBadge'));
      this.addResult('Has removeAllRules function', script.includes('function removeAllRules'));
      
      // Check for required APIs
      this.addResult('Uses declarativeNetRequest', script.includes('chrome.declarativeNetRequest'));
      this.addResult('Uses storage API', script.includes('chrome.storage'));
      this.addResult('Uses action API', script.includes('chrome.action'));
      
      // Check for platform blocking
      const platforms = ['youtube.com', 'tiktok.com', 'netflix.com', 'hulu.com'];
      for (const platform of platforms) {
        this.addResult(`Blocks ${platform}`, script.includes(platform));
      }
      
      // Check error handling
      this.addResult('Has error handling', script.includes('try {') && script.includes('catch'));
      this.addResult('Checks chrome.runtime.lastError', script.includes('chrome.runtime.lastError'));
      
    } catch (error) {
      this.addResult('Background script verification failed', false, error.message);
    }
  }

  verifyContentScript() {
    console.log('\n📜 Verifying Content Script...\n');
    
    try {
      const scriptPath = path.join(this.projectPath, 'content.js');
      const script = fs.readFileSync(scriptPath, 'utf8');
      
      // Check for required functions
      this.addResult('Has loadSettings function', script.includes('function loadSettings'));
      this.addResult('Has removeVideos function', script.includes('function removeVideos'));
      this.addResult('Has muteAndPauseMedia function', script.includes('function muteAndPauseMedia'));
      
      // Check for blocking mechanisms
      this.addResult('Blocks video elements', script.includes('getElementsByTagName(\'video\')'));
      this.addResult('Blocks audio elements', script.includes('getElementsByTagName(\'audio\')'));
      this.addResult('Removes iframes', script.includes('iframe'));
      this.addResult('Intercepts play method', script.includes('HTMLMediaElement.prototype.play'));
      
      // Check for MutationObserver
      this.addResult('Uses MutationObserver', script.includes('MutationObserver'));
      
      // Check error handling
      this.addResult('Has error handling', script.includes('try {') && script.includes('catch'));
      
    } catch (error) {
      this.addResult('Content script verification failed', false, error.message);
    }
  }

  verifyOptionsPage() {
    console.log('\n🎛️ Verifying Options Page...\n');
    
    try {
      // Check HTML structure
      const htmlPath = path.join(this.projectPath, 'options.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      
      this.addResult('Options HTML is valid', html.includes('<!DOCTYPE html>'));
      this.addResult('Has platform toggles', html.includes('blockYouTube') && html.includes('blockTikTok'));
      this.addResult('Includes CSS', html.includes('options.css'));
      this.addResult('Includes JS', html.includes('options.js'));
      
      // Check JavaScript
      const jsPath = path.join(this.projectPath, 'options.js');
      const js = fs.readFileSync(jsPath, 'utf8');
      
      this.addResult('Options JS has loadSettings', js.includes('function loadSettings'));
      this.addResult('Options JS has saveSettings', js.includes('function saveSettings'));
      this.addResult('Options JS handles events', js.includes('addEventListener'));
      this.addResult('Options JS shows notifications', js.includes('showSaveStatus'));
      
      // Check CSS
      const cssPath = path.join(this.projectPath, 'options.css');
      const css = fs.readFileSync(cssPath, 'utf8');
      
      this.addResult('Options CSS exists', css.length > 100);
      this.addResult('Has toggle styles', css.includes('.toggle-switch'));
      this.addResult('Has responsive design', css.includes('@media'));
      
    } catch (error) {
      this.addResult('Options page verification failed', false, error.message);
    }
  }

  verifyImplementedFeatures() {
    console.log('\n🔧 Verifying Implemented Features...\n');
    
    try {
      const backgroundScript = fs.readFileSync(path.join(this.projectPath, 'background.js'), 'utf8');
      
      // Check Netflix/Hulu implementation (from our recent fixes)
      this.addResult('Netflix blocking implemented', 
        backgroundScript.includes('allowNetflix') && backgroundScript.includes('netflix.com'));
      this.addResult('Hulu blocking implemented',
        backgroundScript.includes('allowHulu') && backgroundScript.includes('hulu.com'));
      
      // Check error handling improvements
      this.addResult('Comprehensive error handling added', 
        backgroundScript.split('try {').length > 3); // Multiple try-catch blocks
      
      // Check badge functionality  
      this.addResult('Badge management implemented',
        backgroundScript.includes('setBadgeText') && backgroundScript.includes('setBadgeBackgroundColor'));
      
      // Check action click handler
      this.addResult('Extension icon click handler added',
        backgroundScript.includes('chrome.action.onClicked'));
      
    } catch (error) {
      this.addResult('Feature verification failed', false, error.message);
    }
  }

  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = Math.round((passedTests / totalTests) * 100);

    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: successRate
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };

    // Write reports
    fs.writeFileSync(
      path.join(this.projectPath, 'verification-report.json'),
      JSON.stringify(report, null, 2)
    );

    let mdReport = `# Extension Verification Report\n\n`;
    mdReport += `**Generated:** ${report.timestamp}\n\n`;
    mdReport += `## Summary\n`;
    mdReport += `- **Total Checks:** ${totalTests}\n`;
    mdReport += `- **Passed:** ${passedTests} ✅\n`;
    mdReport += `- **Failed:** ${failedTests} ❌\n`;
    mdReport += `- **Success Rate:** ${successRate}%\n\n`;

    if (successRate >= 90) {
      mdReport += `🎉 **EXCELLENT!** Extension structure is solid.\n\n`;
    } else if (successRate >= 75) {
      mdReport += `✅ **GOOD!** Extension structure looks good with minor issues.\n\n`;
    } else {
      mdReport += `⚠️ **NEEDS WORK** Several issues found.\n\n`;
    }

    mdReport += `## Detailed Results\n\n`;
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      const detail = result.details ? ` - ${result.details}` : '';
      mdReport += `${status} **${result.test}**${detail}\n`;
    }

    fs.writeFileSync(
      path.join(this.projectPath, 'verification-report.md'),
      mdReport
    );

    return report;
  }

  async runAllChecks() {
    console.log('🔍 Simple Video Blocker Extension Verification\n');
    console.log('='.repeat(60));
    
    this.verifyFileStructure();
    this.verifyManifest();
    this.verifyBackgroundScript();
    this.verifyContentScript();
    this.verifyOptionsPage();
    this.verifyImplementedFeatures();
    
    console.log('\n📊 Generating Verification Report...\n');
    const report = this.generateReport();
    
    console.log('='.repeat(60));
    console.log('📋 VERIFICATION RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Checks: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed} ✅`);
    console.log(`Failed: ${report.summary.failed} ❌`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log('='.repeat(60));

    if (report.summary.failed > 0) {
      console.log('\n❌ Failed Checks:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.test}: ${r.details || 'Failed'}`));
    }

    console.log(`\n📋 Reports saved:`);
    console.log(`  - verification-report.json`);
    console.log(`  - verification-report.md`);

    if (report.summary.successRate >= 85) {
      console.log(`\n🎉 Extension code looks ready for testing!`);
      console.log(`\n📖 Next steps:`);
      console.log(`   1. Open Chrome and go to chrome://extensions/`);
      console.log(`   2. Enable "Developer mode" (toggle in top-right)`);
      console.log(`   3. Click "Load unpacked" and select this directory`);
      console.log(`   4. Test the extension manually by:`);
      console.log(`      • Clicking the extension icon to open options`);
      console.log(`      • Trying to visit YouTube/TikTok/Netflix/Hulu`);
      console.log(`      • Checking that videos are blocked`);
      console.log(`      • Toggling settings and testing changes`);
    } else {
      console.log(`\n⚠️ Extension has structural issues. Please fix failed checks before testing.`);
    }

    return report.summary.successRate >= 85;
  }
}

if (require.main === module) {
  const verifier = new ExtensionVerifier();
  verifier.runAllChecks()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = ExtensionVerifier;
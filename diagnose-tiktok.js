const fs = require('fs');
const path = require('path');

class TikTokDiagnostic {
  constructor() {
    this.issues = [];
    this.suggestions = [];
  }

  addIssue(issue, suggestion) {
    this.issues.push(issue);
    this.suggestions.push(suggestion);
    console.log(`❌ ISSUE: ${issue}`);
    console.log(`💡 FIX: ${suggestion}\n`);
  }

  addSuccess(check) {
    console.log(`✅ OK: ${check}`);
  }

  checkContentScriptBlocking() {
    console.log('🔍 Checking Content Script Blocking Logic...\n');
    
    try {
      const contentScript = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
      
      // Check isBlockedDomain function
      if (contentScript.includes('isBlockedDomain')) {
        this.addSuccess('isBlockedDomain function exists');
        
        // Check TikTok domain logic
        const domainCheck = contentScript.match(/domain\.includes\('tiktok\.com'\)\s*&&\s*!settings\.allowTikTok/);
        if (domainCheck) {
          this.addSuccess('TikTok domain blocking logic correct');
        } else {
          this.addIssue(
            'TikTok domain blocking logic may be incorrect',
            'Ensure content script checks: domain.includes("tiktok.com") && !settings.allowTikTok'
          );
        }
      } else {
        this.addIssue(
          'Missing isBlockedDomain function in content script',
          'Add isBlockedDomain function to properly check if domain should be blocked'
        );
      }

      // Check if content script still blocks when TikTok is allowed
      const removeVideosFunction = contentScript.match(/function removeVideos\(\)[^}]+\}/gs);
      if (removeVideosFunction) {
        const functionBody = removeVideosFunction[0];
        
        // Look for TikTok iframe removal that doesn't check settings
        if (functionBody.includes('tiktok.com') && !functionBody.includes('allowTikTok')) {
          this.addIssue(
            'Content script may remove TikTok iframes even when allowed',
            'Make TikTok iframe removal conditional on settings.allowTikTok'
          );
        } else {
          this.addSuccess('TikTok iframe removal respects settings');
        }
      }

      // Check media blocking
      const mediaBlocking = contentScript.includes('muteAndPauseMedia') && 
                           contentScript.includes('isBlockedDomain(currentDomain)');
      if (mediaBlocking) {
        this.addSuccess('Media blocking respects domain settings');
      } else {
        this.addIssue(
          'Media blocking may not check domain settings',
          'Ensure muteAndPauseMedia checks isBlockedDomain before blocking'
        );
      }

    } catch (error) {
      this.addIssue('Cannot read content script', 'Check if content.js exists and is readable');
    }
  }

  checkBackgroundScriptRules() {
    console.log('🔍 Checking Background Script Network Rules...\n');
    
    try {
      const backgroundScript = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
      
      // Check TikTok rule creation
      const tiktokRulePattern = /if\s*\(\s*!result\.allowTikTok\s*\)[^}]+createRule\([^)]*tiktok\.com/s;
      if (tiktokRulePattern.test(backgroundScript)) {
        this.addSuccess('TikTok network rules are conditional on settings');
      } else {
        this.addIssue(
          'TikTok network rules may always be active',
          'Ensure TikTok blocking rules only created when !result.allowTikTok'
        );
      }

      // Check if rules are properly cleared and recreated
      if (backgroundScript.includes('currentRules.clear()') && backgroundScript.includes('updateDynamicRules')) {
        this.addSuccess('Rules are cleared and updated properly');
      } else {
        this.addIssue(
          'Rules may not be cleared properly when settings change',
          'Ensure old rules are removed before adding new ones'
        );
      }

      // Check storage change handling
      if (backgroundScript.includes('chrome.storage.onChanged') && backgroundScript.includes('allowTikTok')) {
        this.addSuccess('Background script listens for TikTok setting changes');
      } else {
        this.addIssue(
          'Background script may not respond to TikTok setting changes',
          'Ensure storage.onChanged listener includes allowTikTok'
        );
      }

    } catch (error) {
      this.addIssue('Cannot read background script', 'Check if background.js exists and is readable');
    }
  }

  checkTikTokDomains() {
    console.log('🔍 Checking TikTok Domain Coverage...\n');
    
    const knownTikTokDomains = [
      'tiktok.com',
      'www.tiktok.com', 
      'vm.tiktok.com',
      'vt.tiktok.com',
      'tiktokv.com',
      'tiktokcdn.com',
      'musical.ly',
      'byteoversea.com'
    ];

    try {
      const backgroundScript = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
      const contentScript = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
      
      // Check which TikTok domains are covered
      const coveredDomains = knownTikTokDomains.filter(domain => 
        backgroundScript.includes(domain) || contentScript.includes(domain)
      );
      
      if (coveredDomains.length === 0) {
        this.addIssue(
          'No TikTok domains found in blocking rules',
          'Add tiktok.com and related domains to blocking rules'
        );
      } else if (coveredDomains.length < 3) {
        this.addSuccess(`Some TikTok domains covered: ${coveredDomains.join(', ')}`);
        this.addIssue(
          `Missing some TikTok domains: ${knownTikTokDomains.filter(d => !coveredDomains.includes(d)).join(', ')}`,
          'Consider adding more TikTok domains for comprehensive blocking'
        );
      } else {
        this.addSuccess(`Good TikTok domain coverage: ${coveredDomains.join(', ')}`);
      }

    } catch (error) {
      this.addIssue('Cannot check domain coverage', 'Check if script files exist');
    }
  }

  checkOptionsPageLogic() {
    console.log('🔍 Checking Options Page Toggle Logic...\n');
    
    try {
      const optionsScript = fs.readFileSync(path.join(__dirname, 'options.js'), 'utf8');
      
      // Check if TikTok toggle saves correctly
      if (optionsScript.includes('allowTikTok') && optionsScript.includes('blockTikTok')) {
        this.addSuccess('Options page handles TikTok toggle');
      } else {
        this.addIssue(
          'Options page may not handle TikTok toggle correctly',
          'Ensure blockTikTok checkbox maps to allowTikTok storage key'
        );
      }

      // Check storage inversion logic
      const storageLogic = optionsScript.match(/\[allowKey\]:\s*!isBlocked/);
      if (storageLogic) {
        this.addSuccess('Toggle state correctly inverted for storage');
      } else {
        this.addIssue(
          'Toggle state may not be inverted correctly',
          'Ensure checked (blocked) state saves as allowPlatform: false'
        );
      }

    } catch (error) {
      this.addIssue('Cannot read options script', 'Check if options.js exists');
    }
  }

  checkCommonIssues() {
    console.log('🔍 Checking Common TikTok Issues...\n');
    
    // Issue 1: TikTok's complex domain structure
    console.log('📝 TikTok uses multiple domains and CDNs:');
    console.log('   - Main site: tiktok.com');
    console.log('   - Mobile: vm.tiktok.com, vt.tiktok.com'); 
    console.log('   - CDN: tiktokv.com, tiktokcdn.com');
    console.log('   - Legacy: musical.ly\n');

    // Issue 2: TikTok's anti-blocking measures
    console.log('📝 TikTok anti-blocking considerations:');
    console.log('   - Dynamic content loading');
    console.log('   - Service worker usage');
    console.log('   - Complex iframe structures');
    console.log('   - Regional domain variations\n');

    // Issue 3: Browser cache
    console.log('📝 Browser cache may retain old rules:');
    console.log('   - Clear browser cache and cookies');
    console.log('   - Reload extension');
    console.log('   - Hard refresh pages (Ctrl+Shift+R)\n');
  }

  generateFixScript() {
    console.log('🔧 Generating Fix Script...\n');
    
    // Enhanced TikTok blocking
    const enhancedTikTokFix = `
// Enhanced TikTok domain coverage for background.js
if (!result.allowTikTok) {
  newRules.push(
    createRule('*tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
    createRule('*vm.tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
    createRule('*vt.tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
    createRule('*tiktokv.com/*', ['media', 'xmlhttprequest', 'other']),
    createRule('*tiktokcdn.com/*', ['media', 'xmlhttprequest', 'other']),
    createRule('*musical.ly/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other'])
  );
}

// Enhanced domain checking for content.js
function isBlockedDomain(domain) {
  return (
    (domain.includes('hulu.com') && !settings.allowHulu) ||
    (domain.includes('netflix.com') && !settings.allowNetflix) ||
    ((domain.includes('youtube.com') || domain.includes('youtu.be')) && !settings.allowYouTube) ||
    ((domain.includes('tiktok.com') || domain.includes('musical.ly')) && !settings.allowTikTok)
  );
}

// More thorough TikTok iframe removal
if (!settings.allowTikTok) {
  const tiktokSelectors = [
    'iframe[src*="tiktok.com"]',
    'iframe[src*="vm.tiktok.com"]', 
    'iframe[src*="vt.tiktok.com"]',
    'iframe[src*="musical.ly"]'
  ];
  
  tiktokSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
}
`;

    fs.writeFileSync(
      path.join(__dirname, 'tiktok-fix-suggestions.txt'),
      enhancedTikTokFix
    );

    this.addSuccess('Generated fix suggestions in tiktok-fix-suggestions.txt');
  }

  runDiagnostics() {
    console.log('🩺 TikTok Blocking Diagnostics\n');
    console.log('='.repeat(60));
    console.log('Checking why TikTok may not work when "allowed"...\n');

    this.checkContentScriptBlocking();
    this.checkBackgroundScriptRules();
    this.checkTikTokDomains();
    this.checkOptionsPageLogic();
    this.checkCommonIssues();
    this.generateFixScript();

    console.log('='.repeat(60));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Issues Found: ${this.issues.length}`);
    
    if (this.issues.length === 0) {
      console.log('✅ No obvious issues found in code structure');
      console.log('\n🤔 Other possible causes:');
      console.log('   1. Browser cache - try incognito mode');
      console.log('   2. TikTok regional restrictions');  
      console.log('   3. Network/ISP blocking');
      console.log('   4. Extension needs reload after settings change');
    } else {
      console.log('\n❌ Issues that may prevent TikTok from working:');
      this.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      
      console.log('\n💡 Suggested fixes:');
      this.suggestions.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion}`);
      });
    }
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Review the fixes above');
    console.log('   2. Test in incognito mode');
    console.log('   3. Check browser console for errors');
    console.log('   4. Try reloading the extension');
    console.log('='.repeat(60));
  }
}

if (require.main === module) {
  const diagnostic = new TikTokDiagnostic();
  diagnostic.runDiagnostics();
}

module.exports = TikTokDiagnostic;
const ExtensionTester = require('./test-runner');
const BlockingVerifier = require('./test-blocking');
const SettingsVerifier = require('./test-settings');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestSuite {
  constructor() {
    this.results = {
      overall: [],
      blocking: [],
      settings: [],
      summary: {}
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Extension Test Suite');
    console.log('=' .repeat(70));
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log('=' .repeat(70));
    console.log('');

    let overallSuccess = true;

    try {
      // Run comprehensive extension tests
      console.log('🔄 Phase 1: Comprehensive Extension Tests');
      console.log('-'.repeat(50));
      const extensionTester = new ExtensionTester();
      const extensionSuccess = await extensionTester.runAllTests();
      this.results.overall = extensionTester.results;
      
      if (!extensionSuccess) {
        console.log('❌ Extension tests failed');
        overallSuccess = false;
      } else {
        console.log('✅ Extension tests passed');
      }
      console.log('');

      // Run blocking verification tests
      console.log('🔄 Phase 2: Blocking Verification Tests');
      console.log('-'.repeat(50));
      const blockingVerifier = new BlockingVerifier();
      const blockingSuccess = await blockingVerifier.runAllBlockingTests();
      this.results.blocking = blockingVerifier.results;
      
      if (!blockingSuccess) {
        console.log('❌ Blocking tests failed');
        overallSuccess = false;
      } else {
        console.log('✅ Blocking tests passed');
      }
      console.log('');

      // Run settings verification tests
      console.log('🔄 Phase 3: Settings Verification Tests');
      console.log('-'.repeat(50));
      const settingsVerifier = new SettingsVerifier();
      const settingsSuccess = await settingsVerifier.runAllSettingsTests();
      this.results.settings = settingsVerifier.results;
      
      if (!settingsSuccess) {
        console.log('❌ Settings tests failed');
        overallSuccess = false;
      } else {
        console.log('✅ Settings tests passed');
      }
      console.log('');

      // Generate comprehensive report
      await this.generateComprehensiveReport();
      
      // Display final results
      this.displayFinalResults(overallSuccess);

      return overallSuccess;

    } catch (error) {
      console.error('💥 Test suite crashed:', error);
      return false;
    }
  }

  async generateComprehensiveReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Calculate statistics for each test phase
    const overallStats = this.calculateStats(this.results.overall);
    const blockingStats = this.calculateStats(this.results.blocking);
    const settingsStats = this.calculateStats(this.results.settings);

    // Combined statistics
    const totalTests = overallStats.total + blockingStats.total + settingsStats.total;
    const totalPassed = overallStats.passed + blockingStats.passed + settingsStats.passed;
    const totalFailed = overallStats.failed + blockingStats.failed + settingsStats.failed;
    const overallSuccessRate = Math.round((totalPassed / totalTests) * 100);

    this.results.summary = {
      timestamp: new Date().toISOString(),
      duration: duration,
      phases: {
        overall: overallStats,
        blocking: blockingStats,
        settings: settingsStats
      },
      totals: {
        tests: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: overallSuccessRate
      }
    };

    // Write comprehensive JSON report
    const comprehensiveReport = {
      summary: this.results.summary,
      detailedResults: {
        overallTests: this.results.overall,
        blockingTests: this.results.blocking,
        settingsTests: this.results.settings
      }
    };

    fs.writeFileSync(
      path.join(__dirname, 'comprehensive-test-report.json'),
      JSON.stringify(comprehensiveReport, null, 2)
    );

    // Write human-readable report
    await this.generateHumanReadableReport();

    console.log('📊 Comprehensive reports generated:');
    console.log('   - comprehensive-test-report.json (machine-readable)');
    console.log('   - comprehensive-test-report.md (human-readable)');
  }

  calculateStats(results) {
    if (!results || results.length === 0) {
      return { total: 0, passed: 0, failed: 0, successRate: 0 };
    }
    
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const successRate = Math.round((passed / total) * 100);

    return { total, passed, failed, successRate };
  }

  async generateHumanReadableReport() {
    const { summary } = this.results;
    const durationMinutes = (summary.duration / 60000).toFixed(2);

    let report = `# Simple Video Blocker Extension - Comprehensive Test Report\n\n`;
    report += `**Generated:** ${summary.timestamp}\n`;
    report += `**Duration:** ${durationMinutes} minutes\n\n`;

    // Executive Summary
    report += `## Executive Summary\n\n`;
    report += `- **Total Tests:** ${summary.totals.tests}\n`;
    report += `- **Passed:** ${summary.totals.passed} ✅\n`;
    report += `- **Failed:** ${summary.totals.failed} ❌\n`;
    report += `- **Overall Success Rate:** ${summary.totals.successRate}%\n\n`;

    // Success/Failure status
    if (summary.totals.successRate >= 80) {
      report += `🎉 **EXTENSION READY FOR PRODUCTION**\n\n`;
    } else if (summary.totals.successRate >= 60) {
      report += `⚠️ **EXTENSION NEEDS IMPROVEMENTS**\n\n`;
    } else {
      report += `❌ **EXTENSION NOT READY - CRITICAL ISSUES FOUND**\n\n`;
    }

    // Phase Results
    report += `## Test Phase Results\n\n`;
    
    const phases = [
      { name: 'Overall Extension Tests', key: 'overall', icon: '🏗️' },
      { name: 'Blocking Verification', key: 'blocking', icon: '🚫' },
      { name: 'Settings Verification', key: 'settings', icon: '⚙️' }
    ];

    for (const phase of phases) {
      const stats = summary.phases[phase.key];
      report += `### ${phase.icon} ${phase.name}\n`;
      report += `- Tests: ${stats.total}\n`;
      report += `- Passed: ${stats.passed} ✅\n`;
      report += `- Failed: ${stats.failed} ❌\n`;
      report += `- Success Rate: ${stats.successRate}%\n\n`;
    }

    // Detailed Results
    report += `## Detailed Test Results\n\n`;

    const testSections = [
      { title: 'Overall Extension Tests', results: this.results.overall, icon: '🏗️' },
      { title: 'Blocking Verification Tests', results: this.results.blocking, icon: '🚫' },
      { title: 'Settings Verification Tests', results: this.results.settings, icon: '⚙️' }
    ];

    for (const section of testSections) {
      report += `### ${section.icon} ${section.title}\n\n`;
      
      if (section.results && section.results.length > 0) {
        for (const result of section.results) {
          const status = result.passed ? '✅' : '❌';
          const details = result.details || result.errorMessage || '';
          const detailText = details ? ` - ${details}` : '';
          report += `${status} **${result.test}**${detailText}\n`;
        }
      } else {
        report += `No test results available.\n`;
      }
      report += `\n`;
    }

    // Recommendations
    report += `## Recommendations\n\n`;
    
    if (summary.totals.failed === 0) {
      report += `🎉 **Excellent!** All tests passed. The extension is ready for production use.\n\n`;
    } else {
      report += `### Issues Found\n\n`;
      
      const allFailures = [
        ...this.results.overall.filter(r => !r.passed),
        ...this.results.blocking.filter(r => !r.passed),
        ...this.results.settings.filter(r => !r.passed)
      ];

      for (const failure of allFailures) {
        report += `- **${failure.test}**: ${failure.details || failure.errorMessage || 'Unknown issue'}\n`;
      }
      report += `\n`;
    }

    // Performance Notes
    if (summary.duration > 300000) { // 5+ minutes
      report += `⚠️ **Performance Note**: Tests took ${durationMinutes} minutes. Consider optimizing for faster feedback.\n\n`;
    }

    // Next Steps
    report += `## Next Steps\n\n`;
    if (summary.totals.successRate >= 80) {
      report += `1. ✅ Extension testing complete - ready for deployment\n`;
      report += `2. 📝 Archive test reports for documentation\n`;
      report += `3. 🚀 Deploy to Chrome Web Store (if applicable)\n`;
    } else {
      report += `1. 🔧 Fix failing tests identified above\n`;
      report += `2. 🔄 Re-run test suite after fixes\n`;
      report += `3. 📊 Aim for 80%+ success rate before deployment\n`;
    }

    fs.writeFileSync(
      path.join(__dirname, 'comprehensive-test-report.md'),
      report
    );
  }

  displayFinalResults(success) {
    const { summary } = this.results;
    const durationMinutes = (summary.duration / 60000).toFixed(2);

    console.log('🏁 FINAL TEST RESULTS');
    console.log('=' .repeat(70));
    console.log(`📊 Total Tests: ${summary.totals.tests}`);
    console.log(`✅ Passed: ${summary.totals.passed}`);
    console.log(`❌ Failed: ${summary.totals.failed}`);
    console.log(`📈 Success Rate: ${summary.totals.successRate}%`);
    console.log(`⏱️ Duration: ${durationMinutes} minutes`);
    console.log('=' .repeat(70));

    if (success) {
      console.log('');
      console.log('🎉 CONGRATULATIONS!');
      console.log('✨ Your Simple Video Blocker extension has passed comprehensive testing!');
      console.log('🚀 The extension is ready for production use.');
    } else {
      console.log('');
      console.log('⚠️ TESTS INCOMPLETE');
      console.log('🔧 Some tests failed. Please review the detailed reports and fix issues.');
      console.log('🔄 Re-run tests after making fixes.');
    }

    console.log('');
    console.log('📋 Detailed reports available:');
    console.log('   - comprehensive-test-report.json');
    console.log('   - comprehensive-test-report.md');
    console.log('');
  }
}

// Run comprehensive tests if called directly
if (require.main === module) {
  const suite = new ComprehensiveTestSuite();
  suite.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = ComprehensiveTestSuite;
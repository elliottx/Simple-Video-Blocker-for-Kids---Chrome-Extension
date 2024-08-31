let currentRules = new Map();

function generateUniqueId() {
  return Math.floor(Math.random() * 1000000000) + 1;
}

function createRule(urlFilter, resourceTypes) {
  let id;
  do {
    id = generateUniqueId();
  } while (currentRules.has(id));

  const rule = {
    id: id,
    priority: 1,
    action: { type: 'block' },
    condition: { urlFilter, resourceTypes }
  };
  currentRules.set(id, rule);
  return rule;
}

function updateRules() {
  chrome.storage.sync.get(['allowYouTube', 'allowTikTok'], (result) => {
    const newRules = [];
    const rulesToRemove = Array.from(currentRules.keys());

    currentRules.clear();

    if (!result.allowYouTube) {
      newRules.push(
        createRule('*youtube.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
        createRule('*youtu.be/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
        createRule('*youtube-nocookie.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
        createRule('*.googlevideo.com/*', ['media', 'xmlhttprequest', 'other'])
      );
    }
    if (!result.allowTikTok) {
      newRules.push(
        createRule('*tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other'])
      );
    }
    
    console.log('Updating rules:', { removeRuleIds: rulesToRemove, addRules: newRules });

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rulesToRemove,
      addRules: newRules
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error updating rules:', JSON.stringify(chrome.runtime.lastError));
        console.error('Error details:', chrome.runtime.lastError.message);
      } else {
        console.log('Rules updated successfully');
      }
    });
  });
}

function removeAllRules() {
  chrome.declarativeNetRequest.getDynamicRules((rules) => {
    const ruleIds = rules.map(rule => rule.id);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error removing all rules:', JSON.stringify(chrome.runtime.lastError));
      } else {
        console.log('All rules removed successfully');
        currentRules.clear();
        updateRules();
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed. Removing all rules and initializing...');
  removeAllRules();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.allowYouTube || changes.allowTikTok) {
    console.log('Settings changed. Updating rules...');
    updateRules();
  }
});
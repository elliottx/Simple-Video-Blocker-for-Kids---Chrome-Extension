let currentRules = new Map();
let warningStates = {
  timerWarningShown: false,
  scheduleWarningShown: false,
  lastWarningHour: null
};

// Notification functions
function showWarningNotification(title, message) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: title,
      message: message,
      priority: 2
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('Error creating notification:', chrome.runtime.lastError);
      } else {
        console.log('Warning notification shown:', title);
      }
    });
  } catch (error) {
    console.error('Exception creating notification:', error);
  }
}

// Badge management functions
function updateBadge(tabId, status) {
  try {
    if (status === 'blocking') {
      // Show red pause button when actively blocking
      chrome.action.setBadgeText({ text: '⏸', tabId: tabId }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting badge text:', chrome.runtime.lastError.message);
        }
      });
      
      chrome.action.setBadgeBackgroundColor({ color: '#f44336', tabId: tabId }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting badge color:', chrome.runtime.lastError.message);
        }
      });
      
      chrome.action.setTitle({ 
        title: 'Simple Video Blocker for Kids\nBlocking videos on this page', 
        tabId: tabId 
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting action title:', chrome.runtime.lastError.message);
        }
      });
    } else if (status === 'allowing') {
      // Show green play button when videos are allowed
      chrome.action.setBadgeText({ text: '▶', tabId: tabId }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting badge text:', chrome.runtime.lastError.message);
        }
      });
      
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: tabId }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting badge color:', chrome.runtime.lastError.message);
        }
      });
      
      chrome.action.setTitle({ 
        title: 'Simple Video Blocker for Kids\nVideos are allowed on this page', 
        tabId: tabId 
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting action title:', chrome.runtime.lastError.message);
        }
      });
    } else {
      // Clear badge when not a video platform
      chrome.action.setBadgeText({ text: '', tabId: tabId }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error clearing badge text:', chrome.runtime.lastError.message);
        }
      });
      
      chrome.action.setTitle({ 
        title: 'Simple Video Blocker for Kids\nNo video content on this page', 
        tabId: tabId 
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error setting action title:', chrome.runtime.lastError.message);
        }
      });
    }
  } catch (error) {
    console.error('Exception in updateBadge:', error);
  }
}

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
  try {
    chrome.storage.sync.get(['allowYouTube', 'allowTikTok', 'allowNetflix', 'allowHulu', 'dailyAllowance', 'timerExpires', 'weeklySchedule'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error reading storage for updateRules:', chrome.runtime.lastError.message);
        return;
      }
      
      const newRules = [];
      const rulesToRemove = Array.from(currentRules.keys());

      currentRules.clear();
      
      // Check if timer is active and allowing videos
      const timerActive = result.dailyAllowance > 0 && 
                         result.timerExpires && 
                         Date.now() < result.timerExpires;
      
      // Check weekly schedule
      let scheduleAllowsVideos = true; // Default to allowed if no schedule set
      if (result.weeklySchedule) {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();
        scheduleAllowsVideos = result.weeklySchedule[currentDay] && 
                              result.weeklySchedule[currentDay][currentHour] === true;
        console.log('Schedule check in updateRules:', {
          day: currentDay,
          hour: currentHour,
          allowed: scheduleAllowsVideos
        });
      }
      
      if (timerActive) {
        console.log('Timer is active - not creating blocking rules');
        console.log('Timer details:', {
          dailyAllowance: result.dailyAllowance,
          timerExpires: result.timerExpires,
          currentTime: Date.now(),
          minutesRemaining: Math.floor((result.timerExpires - Date.now()) / 1000 / 60)
        });
        // Don't create any blocking rules when timer is active
      } else if (scheduleAllowsVideos) {
        console.log('Schedule allows videos at this time - not creating blocking rules');
        // Don't create blocking rules when schedule allows videos
      } else {
        console.log('Creating blocking rules - no active timer and schedule blocks videos');
        // Only create blocking rules when timer is not active or expired
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
            createRule('*tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
            createRule('*vm.tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
            createRule('*vt.tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
            createRule('*tiktokv.com/*', ['media', 'xmlhttprequest', 'other']),
            createRule('*tiktokcdn.com/*', ['media', 'xmlhttprequest', 'other']),
            createRule('*musical.ly/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other'])
          );
        }
        if (!result.allowNetflix) {
          newRules.push(
            createRule('*netflix.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
            createRule('*.nflxvideo.net/*', ['media', 'xmlhttprequest', 'other']),
            createRule('*.nflxso.net/*', ['media', 'xmlhttprequest', 'other'])
          );
        }
        if (!result.allowHulu) {
          newRules.push(
            createRule('*hulu.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
            createRule('*.hulustream.com/*', ['media', 'xmlhttprequest', 'other'])
          );
        }
      }
    
    console.log('Updating rules:', { removeRuleIds: rulesToRemove, addRules: newRules });

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rulesToRemove,
      addRules: newRules
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error updating rules:', JSON.stringify(chrome.runtime.lastError));
        console.error('Error details:', chrome.runtime.lastError.message);
        // Fallback: try again with fewer rules if we hit limits
        if (chrome.runtime.lastError.message.includes('quota')) {
          console.log('Attempting fallback with essential rules only');
          const essentialRules = newRules.slice(0, 10); // Limit to first 10 rules
          chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rulesToRemove,
            addRules: essentialRules
          });
        }
      } else {
        console.log('Rules updated successfully');
      }
    });
    });
  } catch (error) {
    console.error('Exception in updateRules:', error);
  }
}

function removeAllRules() {
  try {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting dynamic rules:', chrome.runtime.lastError.message);
        return;
      }
      
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
  } catch (error) {
    console.error('Exception in removeAllRules:', error);
  }
}

// Timer and schedule checking - check every 5 minutes
let timerCheckInterval = null;

function startTimerAndScheduleCheck() {
  if (timerCheckInterval) return;
  
  console.log('Starting timer and schedule check');
  
  timerCheckInterval = setInterval(() => {
    chrome.storage.sync.get(['dailyAllowance', 'timerExpires', 'weeklySchedule'], (result) => {
      if (result.dailyAllowance > 0 && result.timerExpires) {
        const timeRemaining = result.timerExpires - Date.now();
        const minutesRemaining = Math.floor(timeRemaining / 1000 / 60);
        
        // Check for 5-minute timer warning
        if (minutesRemaining <= 5 && minutesRemaining > 0 && !warningStates.timerWarningShown) {
          showWarningNotification(
            'Video Timer Ending Soon',
            `${minutesRemaining} minutes remaining before videos are blocked`
          );
          warningStates.timerWarningShown = true;
        }
        
        if (Date.now() > result.timerExpires) {
          console.log('Timer expired! Setting to 0 and re-enabling blocking');
          // Reset timer warning state
          warningStates.timerWarningShown = false;
          // Timer expired - set to 0 and update rules
          chrome.storage.sync.set({ dailyAllowance: 0, timerExpires: null }, () => {
            console.log('Timer data cleared, updating rules to block videos');
            
            // Force immediate rule update to re-enable blocking
            chrome.storage.sync.get(['allowYouTube', 'allowTikTok', 'allowNetflix', 'allowHulu'], (settings) => {
              const newRules = [];
              const rulesToRemove = Array.from(currentRules.keys());
              currentRules.clear();
              
              // Create blocking rules based on original platform settings
              if (!settings.allowYouTube) {
                newRules.push(
                  createRule('*youtube.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
                  createRule('*youtu.be/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
                  createRule('*youtube-nocookie.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
                  createRule('*.googlevideo.com/*', ['media', 'xmlhttprequest', 'other'])
                );
              }
              if (!settings.allowTikTok) {
                newRules.push(
                  createRule('*tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
                  createRule('*vm.tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
                  createRule('*vt.tiktok.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
                  createRule('*tiktokv.com/*', ['media', 'xmlhttprequest', 'other']),
                  createRule('*tiktokcdn.com/*', ['media', 'xmlhttprequest', 'other']),
                  createRule('*musical.ly/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other'])
                );
              }
              if (!settings.allowNetflix) {
                newRules.push(
                  createRule('*netflix.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
                  createRule('*.nflxvideo.net/*', ['media', 'xmlhttprequest', 'other']),
                  createRule('*.nflxso.net/*', ['media', 'xmlhttprequest', 'other'])
                );
              }
              if (!settings.allowHulu) {
                newRules.push(
                  createRule('*hulu.com/*', ['sub_frame', 'media', 'xmlhttprequest', 'object', 'other']),
                  createRule('*.hulustream.com/*', ['media', 'xmlhttprequest', 'other'])
                );
              }
              
              console.log('Re-enabling blocking rules:', newRules.length, 'rules');
              
              chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: rulesToRemove,
                addRules: newRules
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Error re-enabling blocking rules:', chrome.runtime.lastError);
                } else {
                  console.log('Blocking rules re-enabled successfully');
                  
                  // Now reload affected tabs
                  setTimeout(() => {
                    chrome.tabs.query({}, (tabs) => {
                      tabs.forEach(tab => {
                        if (tab.url && (
                          tab.url.includes('youtube.com') || 
                          tab.url.includes('youtu.be') ||
                          tab.url.includes('tiktok.com') ||
                          tab.url.includes('netflix.com') ||
                          tab.url.includes('hulu.com')
                        )) {
                          console.log('Reloading tab to apply blocks:', tab.url);
                          chrome.tabs.reload(tab.id);
                        }
                      });
                    });
                  }, 500);
                }
              });
            });
          });
        }
      }
      
      // Check weekly schedule - see if current time period requires rule changes
      if (result.weeklySchedule) {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();
        
        // Check if current hour should allow or block videos
        const scheduleAllowsVideos = result.weeklySchedule[currentDay] && 
                                   result.weeklySchedule[currentDay][currentHour] === true;
        
        console.log('Schedule check:', {
          day: currentDay,
          hour: currentHour,
          allowsVideos: scheduleAllowsVideos
        });
        
        // Check for 5-minute schedule warning (videos currently allowed but will be blocked soon)
        if (scheduleAllowsVideos && !result.dailyAllowance) {
          // Check if next hour will be blocked (handle day transition)
          let nextHour = (currentHour + 1) % 24;
          let nextDay = currentDay;
          
          // If next hour is 0 (midnight), we're going to the next day
          if (nextHour === 0) {
            nextDay = (currentDay + 1) % 7;
          }
          
          const nextHourBlocked = !result.weeklySchedule[nextDay] || 
                                 result.weeklySchedule[nextDay][nextHour] !== true;
          
          // Check if we're in the last 5 minutes of the current hour
          const currentMinutes = now.getMinutes();
          const isLastFiveMinutes = currentMinutes >= 55;
          
          if (nextHourBlocked && isLastFiveMinutes && 
              (warningStates.lastWarningHour !== currentHour || !warningStates.scheduleWarningShown)) {
            
            const nextHourFormatted = nextHour === 0 ? '12am' : 
                                    nextHour < 12 ? `${nextHour}am` : 
                                    nextHour === 12 ? '12pm' : `${nextHour - 12}pm`;
            
            showWarningNotification(
              'Video Schedule Ending Soon',
              `Videos will be blocked at ${nextHourFormatted} (${60 - currentMinutes} minutes remaining)`
            );
            
            warningStates.scheduleWarningShown = true;
            warningStates.lastWarningHour = currentHour;
          }
        }
        
        // Reset schedule warning when hour changes
        if (warningStates.lastWarningHour !== null && warningStates.lastWarningHour !== currentHour) {
          warningStates.scheduleWarningShown = false;
        }
        
        // If schedule has changed blocking status, update rules
        chrome.storage.sync.get(['allowYouTube', 'allowTikTok', 'allowNetflix', 'allowHulu'], (settings) => {
          const shouldCreateRules = !scheduleAllowsVideos && !result.dailyAllowance; // Block if schedule blocks AND no timer active
          const currentRuleCount = currentRules.size;
          
          // Only update if there's a mismatch between current rules and what should be active
          if ((shouldCreateRules && currentRuleCount === 0) || (!shouldCreateRules && currentRuleCount > 0)) {
            console.log('Schedule enforcement: updating rules based on time change');
            updateRules();
            
            // Reload affected video platform tabs
            setTimeout(() => {
              chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                  if (tab.url && (
                    tab.url.includes('youtube.com') || 
                    tab.url.includes('youtu.be') ||
                    tab.url.includes('tiktok.com') ||
                    tab.url.includes('netflix.com') ||
                    tab.url.includes('hulu.com')
                  )) {
                    console.log('Schedule change: Reloading tab to apply new rules:', tab.url);
                    chrome.tabs.reload(tab.id);
                  }
                });
              });
            }, 500);
          }
        });
      }
    });
  }, 300000); // Check every 5 minutes (300,000ms)
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request, 'from tab:', sender.tab?.id);
  
  if (request.type === 'contentBlocked') {
    // Content was blocked on this tab
    if (sender.tab && sender.tab.id) {
      console.log('Setting blocking badge for tab:', sender.tab.id);
      updateBadge(sender.tab.id, 'blocking');
    }
  } else if (request.type === 'contentAllowed') {
    // Content is allowed on this tab (video platform but videos allowed)
    if (sender.tab && sender.tab.id) {
      console.log('Setting allowing badge for tab:', sender.tab.id);
      updateBadge(sender.tab.id, 'allowing');
    }
  } else if (request.type === 'noContentBlocked') {
    // No video content on this tab
    if (sender.tab && sender.tab.id) {
      console.log('Clearing badge for tab:', sender.tab.id);
      updateBadge(sender.tab.id, 'clear');
    }
  }
  
  // Send response to avoid errors
  sendResponse({received: true});
  return true;
});

// Listen for tab changes to update badge
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Tab activated:', activeInfo.tabId);
  // Badge will be updated by content script
});

// Clear badge when tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab loaded completely:', tabId);
    // Content script will send message if blocking
  }
});

// Start timer and schedule check when extension loads
startTimerAndScheduleCheck();

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed. Removing all rules and initializing...');
  
  try {
    // Force set all platforms to blocked on fresh install or update
    if (details.reason === 'install' || details.reason === 'update') {
      // Clear any existing values and force defaults
      chrome.storage.sync.clear(() => {
        chrome.storage.sync.set({
          allowYouTube: false,
          allowTikTok: false,
          allowNetflix: true,
          allowHulu: true
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error setting default storage:', chrome.runtime.lastError.message);
          } else {
            console.log('Default settings initialized: YouTube/TikTok blocked, Netflix/Hulu allowed');
            removeAllRules();
          }
        });
      });
    } else {
      removeAllRules();
    }
  } catch (error) {
    console.error('Exception in onInstalled:', error);
  }
});

// Also initialize rules when extension starts (browser restart, etc.)
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension starting up. Initializing rules...');
  updateRules();
  startTimerAndScheduleCheck(); // Also start timer and schedule check on startup
});

// Handle action click to open options page
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage((error) => {
    if (chrome.runtime.lastError) {
      console.error('Error opening options page:', chrome.runtime.lastError.message);
    }
  });
});

chrome.storage.onChanged.addListener((changes) => {
  try {
    if (changes.allowYouTube || changes.allowTikTok || changes.allowNetflix || changes.allowHulu || 
        changes.dailyAllowance || changes.timerExpires) {
      console.log('Settings or timer changed. Updating rules...');
      
      // If timer was just activated (dailyAllowance changed to > 0), immediately clear all rules
      if (changes.dailyAllowance && changes.dailyAllowance.newValue > 0) {
        console.log('Timer activated - immediately clearing all blocking rules');
        // Reset timer warning when new timer is set
        warningStates.timerWarningShown = false;
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
          const ruleIds = rules.map(rule => rule.id);
          if (ruleIds.length > 0) {
            chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: ruleIds
            }, () => {
              console.log('All blocking rules cleared for timer');
            });
          }
        });
      }
      
      updateRules();
      
      // Reload affected tabs when settings change
      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('Error querying tabs:', chrome.runtime.lastError.message);
          return;
        }
        
        tabs.forEach(tab => {
          if (tab.url) {
            const isYouTube = tab.url.includes('youtube.com') || tab.url.includes('youtu.be');
            const isTikTok = tab.url.includes('tiktok.com');
            const isNetflix = tab.url.includes('netflix.com');
            const isHulu = tab.url.includes('hulu.com');
            
            if ((changes.allowYouTube && isYouTube) || 
                (changes.allowTikTok && isTikTok) ||
                (changes.allowNetflix && isNetflix) ||
                (changes.allowHulu && isHulu)) {
              console.log('Reloading affected tab:', tab.url);
              chrome.tabs.reload(tab.id, (error) => {
                if (chrome.runtime.lastError) {
                  console.error('Error reloading tab:', chrome.runtime.lastError.message);
                }
              });
            }
          }
        });
      });
    }
  } catch (error) {
    console.error('Exception in storage change listener:', error);
  }
});
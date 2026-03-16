// GitHub Issues feedback integration

class GitHubFeedback {
  
  static generateCode() {
    return `
// Replace submitFeedbackData function with this:
async function submitFeedbackData(data) {
  // Your GitHub repository details
  const GITHUB_CONFIG = {
    owner: 'your-username',        // Your GitHub username
    repo: 'video-blocker-feedback', // Repository name
    token: 'your-personal-access-token' // GitHub Personal Access Token
  };
  
  try {
    // Create GitHub issue title and body
    let title = '';
    let labels = [];
    let body = '';
    
    switch(data.type) {
      case 'general':
        title = \`General Feedback - Rating: \${data.rating}/5\`;
        labels = ['feedback', 'general'];
        body = \`## General Feedback

**Rating:** \${data.rating}/5 ⭐

**Feedback:**
\${data.feedback}

---
**Extension Version:** \${data.version}
**Platform:** \${data.platform}
**Submitted:** \${new Date(data.timestamp).toLocaleString()}
\`;
        break;
        
      case 'beta':
        title = \`Beta Features Feedback - \${data.testedFeatures?.join(', ') || 'Unspecified'}\`;
        labels = ['feedback', 'beta'];
        body = \`## Beta Features Feedback

**Rating:** \${data.rating}/5 ⭐
**Features Tested:** \${data.testedFeatures?.join(', ') || 'None specified'}

**Feedback:**
\${data.feedback}

---
**Extension Version:** \${data.version}
**Platform:** \${data.platform}
**Submitted:** \${new Date(data.timestamp).toLocaleString()}
\`;
        break;
        
      case 'issue':
        title = \`[Bug Report] \${data.issueType} - \${data.description.substring(0, 50)}...\`;
        labels = ['bug', 'user-report'];
        body = \`## Issue Report

**Issue Type:** \${data.issueType}

**Description:**
\${data.description}

---
**Extension Version:** \${data.version}
**Platform:** \${data.platform}
**User Agent:** \${data.includeSystemInfo ? data.userAgent : 'Hidden by user'}
**Submitted:** \${new Date(data.timestamp).toLocaleString()}
\`;
        break;
    }
    
    // Create GitHub issue
    const response = await fetch(\`https://api.github.com/repos/\${GITHUB_CONFIG.owner}/\${GITHUB_CONFIG.repo}/issues\`, {
      method: 'POST',
      headers: {
        'Authorization': \`token \${GITHUB_CONFIG.token}\`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        title: title,
        body: body,
        labels: labels
      })
    });
    
    if (!response.ok) {
      throw new Error(\`GitHub API error: \${response.status}\`);
    }
    
    const issue = await response.json();
    console.log('Created GitHub issue:', issue.html_url);
    
  } catch (error) {
    console.error('GitHub issue creation failed:', error);
    // Continue with local storage even if GitHub fails
  }
  
  // Store locally as backup
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['userFeedback'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      
      const existingFeedback = result.userFeedback || [];
      existingFeedback.push({ ...data, githubSent: true });
      
      if (existingFeedback.length > 50) {
        existingFeedback.splice(0, existingFeedback.length - 50);
      }
      
      chrome.storage.local.set({ userFeedback: existingFeedback }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}`;
  }

  static generateInstructions() {
    return `
# GitHub Issues Feedback Setup

## 🐙 How it works:
1. User submits feedback
2. Extension creates GitHub issue automatically
3. You get notifications on GitHub
4. Track and manage feedback like bug reports
5. Users can see their issues and responses

## 🔧 Setup Steps:

### Step 1: Create GitHub repository
1. Create new repository: "video-blocker-feedback"
2. Make it public or private as preferred
3. Add issue templates if desired

### Step 2: Create Personal Access Token
1. Go to GitHub → Settings → Developer settings
2. Personal access tokens → Generate new token
3. Select scopes: "repo" (for private repos) or "public_repo"
4. Copy the token (save it securely!)

### Step 3: Update configuration
1. Replace 'your-username' with your GitHub username
2. Replace 'video-blocker-feedback' with your repo name
3. Replace 'your-personal-access-token' with your token
4. Replace submitFeedbackData function in options.js

### Step 4: Set up notifications
1. Watch your feedback repository
2. Configure email notifications
3. Set up issue templates for consistency

## ✅ Pros:
- ✅ Professional issue tracking
- ✅ Public transparency (if desired)
- ✅ Easy categorization with labels
- ✅ Users can follow their issues
- ✅ Integrated with development workflow
- ✅ Free for public repos
- ✅ Automatic notifications

## ❌ Cons:
- ❌ Requires GitHub account
- ❌ Token management needed
- ❌ More complex setup
- ❌ Public visibility (unless private repo)

## 📊 You'll receive:
- GitHub issue for each feedback
- Email notifications
- Organized by labels and milestones
- Easy search and filtering
- Integration with project management

## 🔒 Security Notes:
- Keep your personal access token secure
- Use environment variables in production
- Consider using GitHub Apps for better security
- Regularly rotate tokens
`;
  }

  static run() {
    console.log('🐙 GitHub Issues Feedback Setup\n');
    console.log('='.repeat(60));
    console.log(this.generateInstructions());
    console.log('\n💻 JavaScript Code:');
    console.log('='.repeat(60));
    console.log(this.generateCode());
    console.log('='.repeat(60));
  }
}

if (require.main === module) {
  GitHubFeedback.run();
}

module.exports = GitHubFeedback;
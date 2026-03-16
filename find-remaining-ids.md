# 🔍 Find Your Remaining Field IDs

## What You Found So Far:
- ✅ **Field 1 (Feedback Type)**: `entry.843107295` 
- ✅ **Field 2 (Rating)**: `entry.256030518`
- ❌ **Field 3 (Feedback Text)**: `entry.???????` ← NEED TO FIND
- ❌ **Field 4 (Extension Version)**: `entry.???????` ← NEED TO FIND  
- ❌ **Field 5 (Platform/Browser)**: `entry.???????` ← NEED TO FIND

## 🔍 How to Find the Missing IDs:

### Method 1: Continue Searching in Source Code
1. **Go back to your form preview**
2. **Right-click → View Page Source**
3. **Search for "entry."** again
4. **Look for MORE entries** beyond the two you found
5. **You should find 5 total entry.xxxxxxxx IDs** (one for each field)

### Method 2: Use the Bookmarklet (Easier!)
1. **Copy this entire line** and save as bookmark:

```
javascript:(function(){const entries=[];document.querySelectorAll('[name^="entry."]').forEach((input,index)=>{const id=input.name.replace('_sentinel','');const label=input.closest('.freebirdFormviewerViewItemsItemItem')?.querySelector('.freebirdFormviewerViewItemsItemItemTitleContainer')?.textContent||'Unknown field';entries.push({index:index+1,id:id,label:label.trim()});});let output='GOOGLE FORMS FIELD IDs:\n\n';entries.forEach(entry=>{output+=`Field ${entry.index}: ${entry.label}\nID: ${entry.id}\n\n`;});output+='Copy these IDs to your extension code!';alert(output);console.log('Field IDs:',entries);})();
```

2. **Go to your Google Form preview page**
3. **Click the bookmarklet**
4. **It will show you ALL field IDs in a popup!**

## 📝 Expected Results:
You should find **5 field IDs total**:
```
Field 1: What type of feedback are you providing?
ID: entry.843107295

Field 2: How would you rate your experience?  
ID: entry.256030518

Field 3: Please share your feedback, suggestions, or describe the issue:
ID: entry.XXXXXXXXX  ← You need this one

Field 4: Extension version (auto-filled)
ID: entry.YYYYYYYYY  ← You need this one

Field 5: Browser and operating system (auto-filled)  
ID: entry.ZZZZZZZZZ  ← You need this one
```

## 🎯 Once You Find All IDs:
Replace the `NEED_TO_FIND` values in the code with your actual entry numbers:

```javascript
const FIELD_MAPPING = {
  feedbackType: 'entry.843107295',    // ✅ You have this
  rating: 'entry.256030518',          // ✅ You have this  
  feedback: 'entry.YOUR_ID_HERE',     // ← Replace with Field 3 ID
  version: 'entry.YOUR_ID_HERE',      // ← Replace with Field 4 ID
  platform: 'entry.YOUR_ID_HERE'      // ← Replace with Field 5 ID
};
```

## 🚨 Important Notes:
- **Remove "_sentinel"** from the IDs when using them in code
- **Keep only the numbers** after "entry."
- **All 5 fields should have unique entry IDs**

Let me know what field IDs you find and I'll update the final code for you!
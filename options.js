document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = ['allowHulu', 'allowNetflix', 'allowYouTube', 'allowTikTok'];

    // Load saved settings
    chrome.storage.sync.get(checkboxes, (result) => {
        checkboxes.forEach(id => {
            document.getElementById(id).checked = result[id] || false;
        });
    });

    // Save settings
    document.getElementById('save').addEventListener('click', () => {
        const settings = {};
        checkboxes.forEach(id => {
            settings[id] = document.getElementById(id).checked;
        });
        chrome.storage.sync.set(settings, () => {
            alert('Settings saved');
        });
    });
});
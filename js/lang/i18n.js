// Internationalization utility for the Snake Game
function I18n() {
    // Available languages
    this.languages = {
        'en': window.en || {},
        'zh': window.zh || {},
        'es': window.es || {}
    };
    
    // Default language
    this.defaultLanguage = 'zh';
    
    // Get saved language preference or use default
    this.currentLanguage = localStorage.getItem('snakeGameLanguage') || this.defaultLanguage;
    
    // Initialize language
    this.setLanguage(this.currentLanguage);
}

// Get translation for a key
I18n.prototype.translate = function(key) {
    var translations = this.languages[this.currentLanguage];
    return translations && translations[key] || 
           (this.languages[this.defaultLanguage] && this.languages[this.defaultLanguage][key]) || 
           key;
};

// Alias for translate
I18n.prototype.get = function(key) {
    return this.translate(key);
};

// Set current language
I18n.prototype.setLanguage = function(lang) {
    if (this.languages[lang]) {
        this.currentLanguage = lang;
        localStorage.setItem('snakeGameLanguage', lang);
        this.updatePageContent();
        return true;
    }
    return false;
};

// Get current language
I18n.prototype.getCurrentLanguage = function() {
    return this.currentLanguage;
};

// Get available languages
I18n.prototype.getAvailableLanguages = function() {
    return Object.keys(this.languages);
};

// Update all translatable elements on the page
I18n.prototype.updatePageContent = function() {
    var self = this;
    var elements = document.querySelectorAll('[data-i18n]');
    
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var key = element.getAttribute('data-i18n');
        
        if (key) {
            element.textContent = self.translate(key);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create global i18n instance
    window.i18n = new I18n();
    
    // Set language selector to current language
    var languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = window.i18n.getCurrentLanguage();
        
        // Add change event listener
        languageSelect.addEventListener('change', function() {
            window.i18n.setLanguage(this.value);
        });
    }
});
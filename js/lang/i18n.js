// Internationalization utility for the Snake Game
class I18n {
    constructor() {
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
    translate(key) {
        const translations = this.languages[this.currentLanguage];
        return translations && translations[key] || 
               (this.languages[this.defaultLanguage] && this.languages[this.defaultLanguage][key]) || 
               key;
    }
    
    // Alias for translate
    get(key) {
        return this.translate(key);
    }
    
    // Set current language
    setLanguage(lang) {
        if (this.languages[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('snakeGameLanguage', lang);
            this.updatePageContent();
            return true;
        }
        return false;
    }
    
    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    // Get available languages
    getAvailableLanguages() {
        return Object.keys(this.languages);
    }
    
    // Update all translatable elements on the page
    updatePageContent() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                element.textContent = this.translate(key);
            }
        });
        
        // Update elements with data-i18n-placeholder attribute (for inputs)
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (key) {
                element.placeholder = this.translate(key);
            }
        });
        
        // Update elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (key) {
                element.title = this.translate(key);
            }
        });
        
        // Update document title
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.getAttribute('data-i18n')) {
            document.title = this.translate(titleElement.getAttribute('data-i18n'));
        }
    }
}

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global i18n instance
    window.i18n = new I18n();
});
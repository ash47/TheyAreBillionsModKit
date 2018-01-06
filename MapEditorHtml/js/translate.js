"use strict";

(function() {
	// Should we force a certain language?
	var forceLanguage = null;

	// Update the translations on the page
	window.updateTranslations = function() {
		$("[data-translate]")
			.jqTranslate(
				'lang', {
					//defaultLang: 'en',
					cache: false,
					//fallbackLang: 'en',
					path: 'translations',
					forceLang: forceLanguage
				}
			);
	};

	// Manually setting translations
	window.setLanguage = function(newLanguage) {
		forceLanguage = newLanguage;
		window.updateTranslations();
	};

	window.getTranslation = function(key, defaultValue, args) {
		// Do we have a translation for this?
		if(window.Translate != null &&
			window.Translate.translatedStrings != null &&
			window.Translate.translatedStrings[key] != null) {
				// Update the default value
				defaultValue = window.Translate.translatedStrings[key];
		} else {
			// Log that we didn't find the translation
			console.log('Missing translation for: ' + key);
		}

		// Do we have any args?
		if(args != null) {
			for(var key in args) {
				defaultValue = defaultValue.replace(
					new RegExp('\{\{' + key + '\}\}', 'g'),
					args[key]
				);
			}
		}

		return defaultValue;
	};

	// When the document is done loading
	$(document).ready(function() {
		// Update translations
		window.updateTranslations();
	});
})();

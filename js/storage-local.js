(function () {
    const STORAGE_KEY = 'genericProdLog';
    const SETTINGS_KEY = 'prodTimerCalibrationSettings';
    const HISTORY_LIMIT = 5;

    function loadHistory() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }

    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function addHistoryEntry(entry) {
        const history = loadHistory();
        history.unshift(entry);

        if (history.length > HISTORY_LIMIT) {
            history.pop();
        }

        saveHistory(history);
        return history;
    }

    function loadCalibrationSettings(defaultSettings) {
        const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
        return Object.assign({}, defaultSettings, savedSettings);
    }

    function saveCalibrationSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    window.ProdTimerStorage = {
        loadHistory,
        saveHistory,
        addHistoryEntry,
        loadCalibrationSettings,
        saveCalibrationSettings
    };
})();

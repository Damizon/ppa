(function () {
    const DEFAULT_SETTINGS = {
        shiftHours: 9,
        maxFactor: 89,
        baseAllowance: 0,
        rampCurve: 1,
        batchSensitivity: 100
    };

    function calculateProductionEstimate(input, settings = DEFAULT_SETTINGS) {
        const activeSettings = normalizeSettings(settings);
        const testQty = Number.parseFloat(input.testQty) || 1;
        const totalQty = Number.parseFloat(input.totalQty) || 0;
        const seconds = Number(input.elapsedMs || 0) / 1000;

        if (seconds <= 0) {
            return null;
        }

        const idealMP = (seconds / testQty) / 60;
        const idealTotalHours = (idealMP * totalQty) / 60;
        const idealUnitSeconds = seconds / testQty;

        const shiftHours = activeSettings.shiftHours;
        const maxFactor = activeSettings.maxFactor;
        const baseAllowance = activeSettings.baseAllowance;
        const rampCurve = activeSettings.rampCurve;
        const batchSensitivity = activeSettings.batchSensitivity;
        let dynamicFactorPercent = 0;
        let shiftProgress = 0;
        let batchMultiplier = 0;

        if (totalQty > testQty) {
            let hoursInsideCurrentShift = idealTotalHours % shiftHours;

            if (hoursInsideCurrentShift === 0 && idealTotalHours > 0) {
                hoursInsideCurrentShift = shiftHours;
            }

            shiftProgress = hoursInsideCurrentShift / shiftHours;
            batchMultiplier = 1 - (batchSensitivity / 100) * (testQty / totalQty);
            batchMultiplier = clamp(batchMultiplier, 0, 1);
            dynamicFactorPercent = Math.pow(shiftProgress, rampCurve) * maxFactor;
            dynamicFactorPercent *= batchMultiplier;
            dynamicFactorPercent = Math.min(dynamicFactorPercent, maxFactor);
        }

        const totalFactorPercent = baseAllowance + dynamicFactorPercent;
        const realTotalHours = idealTotalHours * (1 + totalFactorPercent / 100);
        const realMP = (realTotalHours * 60) / totalQty;
        const realUnitSeconds = (realTotalHours * 3600) / totalQty;

        return {
            ideal: {
                mp: idealMP,
                unitSeconds: idealUnitSeconds,
                totalHours: idealTotalHours
            },
            factor: {
                percent: totalFactorPercent,
                basePercent: baseAllowance,
                dynamicPercent: dynamicFactorPercent,
                shiftProgress,
                batchMultiplier
            },
            real: {
                mp: realMP,
                unitSeconds: realUnitSeconds,
                totalHours: realTotalHours
            }
        };
    }

    function normalizeSettings(settings = {}) {
        return {
            shiftHours: numberOrDefault(settings.shiftHours, DEFAULT_SETTINGS.shiftHours),
            maxFactor: numberOrDefault(settings.maxFactor, DEFAULT_SETTINGS.maxFactor),
            baseAllowance: numberOrDefault(settings.baseAllowance, DEFAULT_SETTINGS.baseAllowance),
            rampCurve: numberOrDefault(settings.rampCurve, DEFAULT_SETTINGS.rampCurve),
            batchSensitivity: numberOrDefault(settings.batchSensitivity, DEFAULT_SETTINGS.batchSensitivity)
        };
    }

    function numberOrDefault(value, fallback) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    window.ProdTimerCalculator = {
        DEFAULT_SETTINGS,
        normalizeSettings,
        calculateProductionEstimate
    };
})();

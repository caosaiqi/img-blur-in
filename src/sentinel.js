let isArray = Array.isArray,
    selectorToAnimationMap = {},
    animationCallbacks = {},
    styleEl,
    styleSheet,
    cssRules;

const sentinel = {
    /**
     * Add watcher.
     * @param {array} cssSelectors - List of CSS selector strings
     * @param {Function} callback - The callback function
     */
    on: function (cssSelectors, callback) {
        if (!callback) return;

        // initialize animationstart event listener
        if (!styleEl) {
            let doc = document,
                head = doc.head;

            // add animationstart event listener
            let animationstartHandler = function (ev, callbacks, l, i) {
                callbacks = animationCallbacks[ev.animationName];

                // exit if callbacks haven't been registered
                if (!callbacks) return;

                // stop other callbacks from firing
                ev.stopImmediatePropagation();

                // iterate through callbacks
                l = callbacks.length;
                for (i = 0; i < l; i++) callbacks[i](ev.target);
            };
            doc.addEventListener('webkitAnimationStart', animationstartHandler, true);
            doc.addEventListener('animationstart', animationstartHandler, true);

            // add stylesheet to document
            styleEl = doc.createElement('style');
            head.insertBefore(styleEl, head.firstChild);
            styleSheet = styleEl.sheet;
            cssRules = styleSheet.cssRules;
        }

        // listify argument and add css rules/ cache callbacks
        (isArray(cssSelectors) ? cssSelectors : [cssSelectors])
            .map(function (selector, animId, isCustomName) {
                animId = selectorToAnimationMap[selector];

                if (!animId) {
                    isCustomName = selector[0] == '!';

                    // define animation name and add to map
                    selectorToAnimationMap[selector] = animId =
                        isCustomName ? selector.slice(1) : 'sentinel-' +
                            Math.random().toString(16).slice(2);

                    // add keyframe rule
                    let keyframesContent = '{from{-webkit-transform:none;-moz-transform:none;-ms-transform:none;-o-transform:none;transform:none;}' +
                        'to{-webkit-transform:none;-moz-transform:none;-ms-transform:none;-o-transform:none;transform:none;}}';
                    let cssRuleIndex;
                    try {
                        cssRuleIndex = styleSheet.insertRule('@-webkit-keyframes ' + animId + keyframesContent, cssRules.length);
                    } catch (e) {}
                    try {
                        cssRuleIndex = styleSheet.insertRule('@-moz-keyframes ' + animId + keyframesContent, cssRules.length);
                    } catch (e) {}
                    try {
                        cssRuleIndex = styleSheet.insertRule('@-o-keyframes ' + animId + keyframesContent, cssRules.length);
                    } catch (e) {}
                    try {
                        cssRuleIndex = styleSheet.insertRule('@keyframes ' + animId + keyframesContent, cssRules.length);
                    } catch (e) {}
                    cssRules[cssRuleIndex]._id = selector;

                    // add selector animation rule
                    if (!isCustomName) {
                        cssRules[styleSheet.insertRule(
                            selector + `{-webkit-animation-duration:0.0001s;-moz-animation-duration:0.0001s;-ms-animation-duration:0.0001s;-o-animation-duration:0.0001s;animation-duration:0.0001s;
                                -webkit-animation-name:${animId};-moz-animation-name:${animId};-ms-animation-name:${animId};-o-animation-name:${animId};animation-name:${animId};}`,
                            cssRules.length)]
                            ._id = selector;
                    }

                    // add to map
                    selectorToAnimationMap[selector] = animId;
                }

                // add to callbacks
                (animationCallbacks[animId] = animationCallbacks[animId] || [])
                    .push(callback);
            });
    },
    /**
     * Remove watcher.
     * @param {array} cssSelectors - List of CSS selector strings
     * @param {Function} callback - The callback function (optional)
     */
    off: function (cssSelectors, callback) {
        // listify argument and iterate through rules
        (isArray(cssSelectors) ? cssSelectors : [cssSelectors])
            .map(function (selector, animId, callbackList, i) {
                // get animId
                if (!(animId = selectorToAnimationMap[selector])) return;

                // get callbacks
                callbackList = animationCallbacks[animId];

                // remove callback from list
                if (callback) {
                    i = callbackList.length;

                    while (i--) {
                        if (callbackList[i] === callback) callbackList.splice(i, 1);
                    }
                } else {
                    callbackList = [];
                }

                // exit if callbacks still exist
                if (callbackList.length) return;

                // clear cache and remove css rules
                i = cssRules.length;

                while (i--) {
                    if (cssRules[i]._id == selector) styleSheet.deleteRule(i);
                }

                delete selectorToAnimationMap[selector];
                delete animationCallbacks[animId];
            });
    },
    /**
     * Reset watchers and cache
     */
    reset: function () {
        selectorToAnimationMap = {};
        animationCallbacks = {};
        if (styleEl) styleEl.parentNode.removeChild(styleEl);
        styleEl = 0;
    }
}

export default sentinel

/**
 * jQuery Slideshow-ToolKit
 * © Etienne Magnier
 * Licence: MIT
 */

(function ($) {
    'use strict';

    /**
     * Slideshow ToolKit
     * @param htmlNode
     * @constructor
     */
    function Slideshow(htmlNode) {
        var $htmlNode = $(htmlNode).first(),
            stk = this,
            intervalFn,
            isInitialized = false;

        /**
         * Slider: Defines the item container which will be moved depending to the item to display
         * @type {*|HTMLElement}
         * @default $()
         */
        stk.$slider = $();

        /**
         * Items: All the slide items of the slideshow
         * @type {*|HTMLElement}
         * @default $()
         */
        stk.$items = $();

        /**
         * Previous Button
         * @type {*|HTMLElement}
         * @default $()
         */
        stk.$prevBtn = $();

        /**
         * Next Button
         * @type {*|HTMLElement}
         * @default $()
         */
        stk.$nextBtn = $();

        /**
         * Auto Play: can be 'no', 'yes' or 'once'
         * @type {string}
         * @default 'no'
         */
        stk.autoPlay = 'no';

        /**
         * Pause on mouse over
         * @type {boolean}
         * @default false
         */
        stk.pauseOnMouseOver = false;

        /**
         * Auto play timer (in ms)
         * @type {number}
         * @default 6000
         */
        stk.autoPlayTimer = 6000;

        /**
         * Items per Group
         * @type {number}
         * @default 1
         */
        stk.itemsPerGroup = 1;

        /**
         * Transition Duration in ms
         * @type {number}
         * @default 600
         */
        stk.transitionDuration = 600;

        /**
         * Transition Easing
         * @type {string}
         * @default 'easeInOutCirc'
         */
        stk.transitionEasing = 'easeInOutCirc';

        /**
         * If item transitions is called more than once before the first transition is finish, only one transition instance will be called.
         * @type {boolean}
         * @default false
         */
        stk.throttleItemTransitions = false;

        /**
         * State CSS Class
         * @type {{main: {namespace: string, initialized: string, runningState: string, pausedState: string, touchStart: string, touchRelease: string}, item: {namespace: string, active: string, previousAction: string, nextAction: string}, button: {namespace: string, active: string}, pager: {namespace: string, active: string}}}
         */
        stk.CssClass = {
            main: {
                namespace: 'slideshow--',
                initialized: 'ready',
                runningState: 'running',
                pausedState: 'paused',
                touchStart: 'touch',
                touchRelease: 'release'
            },
            item: {
                namespace: 'slideshow__item--',
                active: 'active',
                previousAction: 'prev',
                nextAction: 'next'
            },
            button: {
                namespace: 'slideshow__btn--',
                active: 'active'
            },
            pager: {
                namespace: 'slideshow__pager--',
                active: 'active'
            }
        };

        /**
         * onInitialized
         */
        stk.onInitialized = function () {};

        /**
         * onBeforeSliding
         */
        stk.onBeforeSliding = function () {};

        /**
         * onCompleteSliding
         */
        stk.onCompleteSliding = function () {};

        // Verbose Mode
        stk.verbose = false;

        /**
         * Get Last Group Index
         * @returns {number}
         */
        stk.getLastGroupIndex = function() {
            return Math.ceil(stk.$items.length / stk.itemsPerGroup) - 1;
        };
        var _currentGroupIndex = 0;

        /**
         * Get Current Group Index
         * @returns {number}
         */
        stk.getCurrentGroupIndex = function() {
            return _currentGroupIndex;
        };

        /**
         * Get the index of the first item in a group
         * @param groupIndex
         * @returns {number}
         */
        stk.getFirstGroupItemIndex = function(groupIndex) {
            return ((groupIndex + 1) * stk.itemsPerGroup - (stk.itemsPerGroup - 1)) - 1;
        };

        /**
         * Get the current state of the auto play feature
         * @returns {string}
         */
        stk.getAutoPlayState = function() {
            return _autoPlayState;
        };
        var _autoPlayState = 'disabled';

        /**
         * Get the Slider Offset
         * @param {number} groupIndex
         * @returns {{top: number, left: number}|undefined}
         */
        stk.getSliderOffset = function(groupIndex) {
            if (stk.$slider.length === 0) {
                log(errorMsg.undefinedSlider);
                return undefined;
            }

            groupIndex = Math.min(groupIndex, stk.getLastGroupIndex());
            groupIndex = Math.max(groupIndex, 0);

            var itemIndex = stk.getFirstGroupItemIndex(groupIndex);

            return {
                top: parseInt(stk.$slider.data('defaultTop'), 10) - $(stk.$items[itemIndex]).position().top,
                left: parseInt(stk.$slider.data('defaultLeft'), 10) - $(stk.$items[itemIndex]).position().left
            };
        };

        /**
         * Set the Slider Offset
         * @param {{top: number, left: number}} [offset]
         * @returns {Slideshow}
         */
        stk.setSliderOffset = function (offset) {
            if (stk.$slider.length === 0) {
                log(errorMsg.undefinedSlider);
                return undefined;
            }

            offset = offset || {};

            if (typeof offset.top === 'undefined') {
                offset.top = stk.$slider.position().top;
            }

            if (typeof offset.left === 'undefined') {
                offset.left = stk.$slider.position().left;
            }

            stk.stop();
            stk.transition(offset, 0, 'linear');

            return this;
        };

        /**
         * Attach CSS Classes and JS Events on the Slideshow
         * @returns {Slideshow}
         */
        stk.attach = function() {
            if (isInitialized) {
                return stk;
            }

            if (stk.$slider.length === 1) {
                var baseTop = stk.$slider.position().top,
                    baseLeft = stk.$slider.position().left;

                stk.$slider.css({
                    position: 'relative',
                    top: baseTop,
                    left: baseLeft
                });

                if (stk.$slider.data('defaultLeft') === undefined || stk.$slider.data('defaultTop') === undefined) {
                    stk.$slider.data('defaultLeft', baseLeft);
                    stk.$slider.data('currentLeft', baseLeft);
                    stk.$slider.data('defaultTop', baseTop);
                    stk.$slider.data('currentTop', baseTop);
                }

                stk.$slider.data('sliding', false);
            }

            // Back Button
            stk.$prevBtn.on('click.stk', function (e) {
                e.preventDefault();
                stk.stop().prev();
            });

            // Next Button
            stk.$nextBtn.on('click.stk', function (e) {
                e.preventDefault();
                stk.stop().next();
            });

            // Pause the slideshow on mouse hover
            if (stk.pauseOnMouseOver) {
                $htmlNode.on({
                    'mouseenter.stk touchstart.stk touchmove.stk': function() {
                        stk.stop();
                    },
                    'mouseleave.stk touchend.stk': function() {
                        stk.play();
                    }
                });
            }

            // Initialized Flag
            isInitialized = true;

            // Custom event
            stk.onInitialized();

            // AutoPlay feature
            if (stk.autoPlay !== 'no' && stk.autoPlayTimer > 0) {
                _autoPlayState = 'active';
                stk.play();
            }

            return stk;
        };

        /**
         * Play
         * @returns {Slideshow}
         */
        stk.play = function () {
            if (stk.$items.length > stk.itemsPerGroup) {

                if (_autoPlayState === 'active') {
                    intervalFn = setInterval(function () {
                        if (_currentGroupIndex < stk.getLastGroupIndex()) {
                            stk.gotoGroup(_currentGroupIndex + 1);
                        } else {
                            if (stk.autoPlay === 'once') {
                                _autoPlayState = 'done';
                                stk.stop();
                            }
                            stk.gotoGroup(0);
                        }

                    }, stk.autoPlayTimer);
                }
            }

            return stk;
        };

        /**
         * Stop
         * @returns {Slideshow}
         */
        stk.stop = function() {
            clearInterval(intervalFn);
            return stk;
        };

        /**
         * Go to Previous Group
         * @returns {Slideshow}
         */
        stk.prev = function () {
            if (stk.$items.length > stk.itemsPerGroup) {
                stk.stop();
                stk.gotoGroup(_currentGroupIndex - 1);
            }
            return stk;
        };

        /**
         * Go to Next Group
         * @returns {Slideshow}
         */
        stk.next = function () {
            if (stk.$items.length > stk.itemsPerGroup) {
                stk.stop();
                stk.gotoGroup(_currentGroupIndex + 1);
            }
            return stk;
        };

        /**
         * Go to First Group
         * @returns {Slideshow}
         */
        stk.first = function () {
            if (stk.$items.length > stk.itemsPerGroup && _currentGroupIndex > 0) {
                stk.stop();
                stk.gotoGroup(0);
            }

            return stk;
        };

        /**
         * Go to Last Group
         * @returns {Slideshow}
         */
        stk.last = function () {
            if (stk.$items.length > stk.itemsPerGroup && _currentGroupIndex < stk.getLastGroupIndex()) {
                stk.stop();
                stk.gotoGroup(stk.getLastGroupIndex());
            }

            return stk;
        };

        /**
         * Go to Closest Group
         * @returns {Slideshow}
         */
        stk.closest = function () {
            if (stk.$slider.length === 0) {
                log(errorMsg.undefinedSlider);
                return stk;
            }

            var sliderX = stk.$slider.parent().width() / 2,
                sliderY = stk.$slider.parent().height() / 2,
                closestItem = -1,
                shortestDistance = 0;

            stk.$items.each(function (i) {
                var itemX = $(this).position().left + $(this).width() / 2 + stk.$slider.position().left,
                    itemY = $(this).position().top + $(this).height() / 2 + stk.$slider.position().top;

                var dx = sliderX - itemX,
                    dy = sliderY - itemY,
                    distance = Math.sqrt(dx * dx + dy * dy);

                if (i === 0) {
                    shortestDistance = distance;
                    closestItem = i;
                }

                if (shortestDistance > distance) {
                    shortestDistance = distance;
                    closestItem = i;
                }
            });

            stk.gotoGroup(stk.getGroupIndexFromItemIndex(closestItem));

            return stk;
        };

        /**
         * Get the Group Index from an Item Index
         * @param {number} itemIndex
         * @returns {number}
         */
        stk.getGroupIndexFromItemIndex = function (itemIndex) {
            return Math.ceil((itemIndex + 1) / stk.itemsPerGroup) - 1;
        };

        /**
         * Go to a Specific Group
         * @param {number} groupIndex
         * @returns {Slideshow}
         */
        stk.gotoGroup = function (groupIndex) {
            if (groupIndex >= 0 && groupIndex <= stk.getLastGroupIndex()) {

                if (stk.$slider.data('sliding') !== true || !stk.throttleItemTransitions) {

                    // Custom event
                    stk.onBeforeSliding();

                    _currentGroupIndex = groupIndex;
                    var offset = stk.getSliderOffset(groupIndex);

                    if (stk.$slider.length === 1) {
                        stk.$slider.data('sliding', true);
                    }

                    stk.transition(offset, stk.transitionDuration, stk.transitionEasing);

                    setTimeout(function () {
                        if (stk.$slider.length === 1) {
                            stk.$slider.data('currentTop', offset.top);
                            stk.$slider.data('currentLeft', offset.left);
                        }
                        // Custom event
                        stk.onCompleteSliding();

                        if (stk.$slider.length === 1) {
                            stk.$slider.data('sliding', false);
                        }
                    }, stk.transitionDuration);
                }
            }

            return stk;
        };

        /**
         * Move the Slider
         * @param {{top: number, left: number}} offset
         * @param {number} [duration] - Custom duration in ms
         * @param {string} [easing] - Custom easing
         * @returns {Slideshow}
         */
        stk.transition = function (offset, duration, easing) {

            if (typeof duration === 'undefined') {
                duration = stk.transitionDuration;
            }

            if (typeof easing === 'undefined') {
                easing = stk.transitionEasing;
            }

            var css = {
                top: offset.top + 'px',
                left: offset.left + 'px'
            };

            if (stk.$slider.length === 1) {
                stk.$slider.stop(true).animate(css, duration, easing);
            }

            return stk;
        };

        /**
         * Remove CSS Classes and JS Events on the Slideshow
         */
        stk.detach = function () {
            stk.stop();

            if (stk.$slider.length === 1) {
                // TODO: remove inline styles
                stk.$slider.removeData('defaultLeft');
                stk.$slider.removeData('defaultTop');
                stk.$slider.stop();
            }

            // TODO: refactor this

            // Remove the Slideshow ToolKit Instance
            $htmlNode.removeData('stk');

            $htmlNode.off('.stk');
            stk.$prevBtn.off('.stk');
            stk.$nextBtn.off('.stk');

            // Initialized Flag
            isInitialized = false;
        };

        function log() {
            if (stk.verbose && arguments.length > 0) {
                var s = arguments[0];
                for (var i = 1; i < arguments.length; i++) {
                    var reg = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
                    s = s.replace(reg, arguments[i]);
                }
                console.log(s);
            }
        }

        // Errors messages
        var errorMsg = {
            alreadyInitialized: 'Slideshow ToolKit: already initialized.',
            btnsAlreadyInitialized: 'Slideshow ToolKit: buttons already initialized.',
            actionNotAvailable: 'Slideshow ToolKit: {0} action is called but the Slideshow is not yet initialized.',
            undefinedSlider: 'Slideshow ToolKit: the slider is undefined.'
        };
    }

    jQuery.fn.extend({
        slideshow: function (options) {

            // Get/Set the Slideshow ToolKit instance
            var el = $(this).first().data('stk'),
                isInitialized;
            if (el) {
                isInitialized = true;
            } else {
                isInitialized = false;
                el = new Slideshow($(this).first());
                $(this).data('stk', el);
            }

            // Merge optional properties
            if (typeof options === 'object') {
                for (var option in options) {
                    el[option] = options[option];
                }
            }

            // Initialization
            if (!isInitialized) {
                el.attach();
            }

            return el;
        }
    });
})(jQuery);

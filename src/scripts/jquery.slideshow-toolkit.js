/**
 * jQuery Slideshow-ToolKit
 * © Etienne Magnier
 * Licence: MIT
 */

(function ($) {
    'use strict';

    jQuery.fn.extend({
        slideshow: function (options) {

            // Errors messages
            var errorMsg = {
                alreadyInitialized: 'Slideshow ToolKit: already initialized.',
                btnsAlreadyInitialized: 'Slideshow ToolKit: buttons already initialized.',
                actionNotAvailable: 'Slideshow ToolKit: {0} action is called but the Slideshow is not yet initialized.',
                undefinedContainer: 'Slideshow ToolKit: the item container is undefined.'
            };

            // Slideshow ToolKit Class
            function Stk(context) {
                var _stk = this,
                    _intervalFn;

                // HTML Nodes
                _stk.$context = $(context);
                _stk.$container = $();
                _stk.$items = $();

                // Optional Buttons & Pager
                _stk.$prevBtn = $();
                _stk.$nextBtn = $();
                _stk.isActiveCssClass = 'is-active';

                // Auto Play
                _stk.autoPlay = 'no'; // no, yes, once
                _stk.pauseOnMouseOver = true;
                _stk.autoPlayTimer = 6000;

                // Slide Effects
                _stk.itemsPerGroup = 1;
                _stk.fxDuration = 600;
                _stk.fxEasing = 'easeInOutCirc';
                _stk.fxDebounce = false;
                _stk.animateCssClass = '';

                // Transitions CSS Classes
                _stk.CssClass = {
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

                // Custom Events
                _stk.onInitialized = function () {};
                _stk.onBeforeSliding = function () {};
                _stk.onCompleteSliding = function () {};

                // Verbose Mode
                _stk.verbose = false;

                var _initialized = false;
                _stk.isInitialized = function() {
                    return _initialized;
                };

                var _currentGroupIndex = 0;
                _stk.getLastGroupIndex = function() {
                    return Math.ceil(_stk.$items.length / _stk.itemsPerGroup) - 1;
                };

                _stk.getCurrentGroupIndex = function() {
                    return _currentGroupIndex;
                };

                _stk.getFirstGroupItemIndex = function(groupIndex) {
                    return ((groupIndex + 1) * _stk.itemsPerGroup - (_stk.itemsPerGroup - 1)) - 1;
                };

                var _autoPlayState = 'disabled';
                _stk.getAutoPlayState = function() {
                    return _autoPlayState;
                };

                _stk.getContainerOffset = function(groupIndex) {
                    if (_stk.$container.length === 0) {
                        log(errorMsg.undefinedContainer);
                        return undefined;
                    }

                    groupIndex = Math.min(groupIndex, _stk.getLastGroupIndex());
                    groupIndex = Math.max(groupIndex, 0);
                    var itemIndex = _stk.getFirstGroupItemIndex(groupIndex);

                    return {
                        top: parseInt(_stk.$container.data('defaultTop'), 10) - $(_stk.$items[itemIndex]).position().top,
                        left: parseInt(_stk.$container.data('defaultLeft'), 10) - $(_stk.$items[itemIndex]).position().left
                    };
                };

                _stk.setContainerOffset = function (offset) {
                    if (_stk.$container.length === 0) {
                        log(errorMsg.undefinedContainer);
                        return undefined;
                    }

                    offset = offset || {};

                    if (typeof offset.top === 'undefined') {
                        offset.top = _stk.$container.position().top;
                    }

                    if (typeof offset.left === 'undefined') {
                        offset.left = _stk.$container.position().left;
                    }

                    _stk.stop();
                    _stk.animate(offset, 0, 'linear');

                    return _stk;
                };

                _stk.attach = function() {
                    if (_initialized) {
                        return _stk;
                    }

                    if (_stk.$container.length === 1) {
                        var baseTop = _stk.$container.position().top,
                            baseLeft = _stk.$container.position().left;

                        _stk.$container.css({
                            position: 'relative',
                            top: baseTop,
                            left: baseLeft
                        });

                        if (_stk.$container.data('defaultLeft') === undefined || _stk.$container.data('defaultTop') === undefined) {
                            _stk.$container.data('defaultLeft', baseLeft);
                            _stk.$container.data('currentLeft', baseLeft);
                            _stk.$container.data('defaultTop', baseTop);
                            _stk.$container.data('currentTop', baseTop);
                        }

                        _stk.$container.data('sliding', false);
                    }

                    // Back Button
                    _stk.$prevBtn.on('click.stk', function (e) {
                        e.preventDefault();
                        _stk.stop();
                        _stk.gotoGroup(_currentGroupIndex - 1);
                    });

                    // Next Button
                    _stk.$nextBtn.addClass(_stk.isActiveCssClass);
                    _stk.$nextBtn.on('click.stk', function (e) {
                        e.preventDefault();
                        _stk.stop();
                        _stk.gotoGroup(_currentGroupIndex + 1);
                    });

                    // Initialized Flag
                    _initialized = true;

                    // Custom event
                    _stk.onInitialized();

                    // AutoPlay feature
                    if (_stk.autoPlay !== 'no' && _stk.autoPlayTimer > 0) {
                        _autoPlayState = 'active';
                        _stk.play(_stk.autoPlayTimer);
                    }

                    return _stk;
                };

                _stk.play = function (autoPlayTimer) {
                    if (_stk.$items.length > _stk.itemsPerGroup) {

                        if (_autoPlayState === 'active') {
                            _intervalFn = setInterval(function () {
                                if (_currentGroupIndex < _stk.getLastGroupIndex()) {
                                    _stk.gotoGroup(_currentGroupIndex + 1);
                                } else {
                                    if (_stk.autoPlay === 'once') {
                                        _autoPlayState = 'done';
                                        _stk.stop();
                                    }
                                    _stk.gotoGroup(0);
                                }

                            }, autoPlayTimer);
                        }
                    }

                    return _stk;
                };

                _stk.stop = function() {
                    clearInterval(_intervalFn);

                    return _stk;
                };

                _stk.prev = function () {
                    if (_stk.$items.length > _stk.itemsPerGroup) {
                        _stk.stop();
                        _stk.gotoGroup(_currentGroupIndex - 1);
                    }

                    return _stk;
                };

                _stk.next = function () {
                    if (_stk.$items.length > _stk.itemsPerGroup) {
                        _stk.stop();
                        _stk.gotoGroup(_currentGroupIndex + 1);
                    }

                    return _stk;
                };

                _stk.first = function () {
                    if (_stk.$items.length > _stk.itemsPerGroup && _currentGroupIndex > 0) {
                        _stk.stop();
                        _stk.gotoGroup(0);
                    }

                    return _stk;
                };

                _stk.last = function () {
                    if (_stk.$items.length > _stk.itemsPerGroup && _currentGroupIndex < _stk.getLastGroupIndex()) {
                        _stk.stop();
                        _stk.gotoGroup(_stk.getLastGroupIndex());
                    }

                    return _stk;
                };

                _stk.closest = function () {
                    if (_stk.$container.length === 0) {
                        log(errorMsg.undefinedContainer);
                        return _stk;
                    }

                    var containerX = _stk.$container.parent().width() / 2,
                        containerY = _stk.$container.parent().height() / 2,
                        closestItem = -1,
                        shortestDistance = 0;

                    _stk.$items.each(function (i) {
                        var itemX = $(this).position().left + $(this).width() / 2 + _stk.$container.position().left,
                            itemY = $(this).position().top + $(this).height() / 2 + _stk.$container.position().top;

                        var dx = containerX - itemX,
                            dy = containerY - itemY,
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

                    _stk.gotoGroup(_stk.getGroupIndexFromItemIndex(closestItem));

                    return _stk;
                };

                _stk.getGroupIndexFromItemIndex = function (itemIndex) {
                    return Math.ceil((itemIndex + 1) / _stk.itemsPerGroup) - 1;
                };

                _stk.gotoGroup = function (groupIndex) {
                    if (groupIndex >= 0 && groupIndex <= _stk.getLastGroupIndex()) {

                        var fxDuration, fxEasing, fxDebounce;

                        fxDuration = _stk.fxDuration;
                        fxEasing = _stk.fxEasing;
                        fxDebounce = _stk.fxDebounce;

                        if (_stk.$container.data('sliding') !== true || !fxDebounce) {

                            // Custom event
                            _stk.onBeforeSliding();

                            if (_stk.$container.length === 1) {
                                _stk.$container.addClass(_stk.animateCssClass);
                            }

                            _currentGroupIndex = groupIndex;
                            var offset = _stk.getContainerOffset(groupIndex);

                            if (_stk.$container.length === 1) {
                                _stk.$container.data('sliding', true);
                            }

                            _stk.animate(offset, fxDuration, fxEasing);

                            setTimeout(function () {
                                if (_stk.$container.length === 1) {
                                    _stk.$container.data('currentTop', offset.top);
                                    _stk.$container.data('currentLeft', offset.left);
                                    _stk.$container.removeClass(_stk.animateCssClass);
                                }
                                // Custom event
                                _stk.onCompleteSliding();

                                if (_stk.$container.length === 1) {
                                    _stk.$container.data('sliding', false);
                                }
                            }, fxDuration);

                        }
                    }

                    return _stk;
                };

                _stk.animate = function (offset, duration, easing) {
                    if (typeof duration === 'undefined') {
                        duration = _stk.fxDuration;
                    }

                    if (typeof easing === 'undefined') {
                        easing = _stk.fxEasing;
                    }

                    if (_stk.$container.length === 1) {
                        _stk.$container.stop(true).animate({
                            top: offset.top + 'px',
                            left: offset.left + 'px'
                        }, duration, easing);
                    }

                    return _stk;
                };

                _stk.detach = function () {
                    _stk.stop();

                    if (_stk.$container.length === 1) {
                        // TODO: remove inline styles
                        _stk.$container.removeData('defaultLeft');
                        _stk.$container.removeData('defaultTop');
                        _stk.$container.stop();
                    }

                    // TODO: refactor this
                    // Remove Custom Class and Events on Buttons
                    _stk.$prevBtn.off('.stk').removeClass(_stk.isActiveCssClass);
                    _stk.$nextBtn.off('.stk').removeClass(_stk.isActiveCssClass);

                    // Remove the Slideshow ToolKit Instance
                    _stk.$context.removeData('stk');
                };

                function log() {
                    if (_stk.verbose && arguments.length > 0) {
                        var s = arguments[0];
                        for (var i = 1; i < arguments.length; i++) {
                            var reg = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
                            s = s.replace(reg, arguments[i]);
                        }
                        console.log(s);
                    }
                }
            }

            // Get/Set the Slideshow ToolKit instance
            var stk = $(this).first().data('stk');
            if (!stk) {
                stk = new Stk($(this).first());
                $(this).data('stk', stk);
            }

            // Merge optional properties
            if (typeof options === 'object') {
                for (var option in options) {
                    stk[option] = options[option];
                }
            }

            // Initialization
            if (!stk.isInitialized()) {
                stk.attach();
            }

            return stk;
        }
    });
})(jQuery);

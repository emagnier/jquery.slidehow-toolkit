/**
 * Slidr
 * © Etienne Magnier
 * Licence: MIT
 */

(function ($) {
    'use strict';

    jQuery.fn.extend({
        slidr: function (options) {

            // Errors messages
            var errorMsg = {
                alreadyInitialized: 'Slidr: already initialized.',
                btnsAlreadyInitialized: 'Slidr: buttons already initialized.',
                actionNotAvailable: 'Slidr: {0} action is called but the Slidr is not yet initialized.'
            };

            // Slidr Class
            function Slidr(context) {
                var _slidr = this,
                    _intervalFn;

                // HTML Nodes
                _slidr.$context = $(context);
                _slidr.$container = $();
                _slidr.$items = $();

                // Optional Buttons & Pager
                _slidr.$prevBtn = $();
                _slidr.$nextBtn = $();
                _slidr.isActiveCssClass = 'is-active';

                // Auto Play
                _slidr.autoPlay = 'no'; // no, yes, once
                _slidr.autoPlayTimer = 6000;

                // Slide Effects
                _slidr.itemsPerGroup = 1;
                _slidr.fxDuration = 600;
                _slidr.fxEasing = 'easeInOutCirc';
                _slidr.fxDebounce = false;
                _slidr.fxAlternateDuration = 200;
                _slidr.fxAlternateEasing = 'easeOutCirc';
                _slidr.fxAlternateDebounce = true;
                _slidr.animateCssClass = '';
                _slidr.alternateAnimateCssClass = '';

                // Custom Events
                _slidr.onInitialized = function () {};
                _slidr.onBeforeSliding = function () {};
                _slidr.onAlternateBeforeSliding = function () {};
                _slidr.onCompleteSliding = function () {};
                _slidr.onAlternateCompleteSliding = function () {};

                // Verbose Mode
                _slidr.verbose = false;

                var _initialized = false;
                _slidr.isInitialized = function() {
                    return _initialized;
                };

                var _currentGroupIndex = 0;
                _slidr.getLastGroupIndex = function() {
                    return Math.ceil(_slidr.$items.length / _slidr.itemsPerGroup) - 1;
                };

                _slidr.getCurrentGroupIndex = function() {
                    return _currentGroupIndex;
                };

                _slidr.getFirstGroupItemIndex = function(groupIndex) {
                    return ((groupIndex + 1) * _slidr.itemsPerGroup - (_slidr.itemsPerGroup - 1)) - 1;
                };

                var _autoPlayState = 'disabled';
                _slidr.getAutoPlayState = function() {
                    return _autoPlayState;
                };

                _slidr.getContainerOffset = function(groupIndex) {
                    groupIndex = Math.min(groupIndex, _slidr.getLastGroupIndex());
                    groupIndex = Math.max(groupIndex, 0);
                    var itemIndex = _slidr.getFirstGroupItemIndex(groupIndex);

                    return {
                        top: parseInt(_slidr.$container.data('defaultTop'), 10) - $(_slidr.$items[itemIndex]).position().top,
                        left: parseInt(_slidr.$container.data('defaultLeft'), 10) - $(_slidr.$items[itemIndex]).position().left
                    };
                };

                _slidr.setContainerOffset = function (offset) {
                    if (_initialized) {
                        offset = offset || {};

                        if (typeof offset.top === 'undefined') {
                            offset.top = _slidr.$container.position().top;
                        }

                        if (typeof offset.left === 'undefined') {
                            offset.left = _slidr.$container.position().left;
                        }

                        _slidr.stop();
                        _slidr.animate(offset, 0, 'linear');

                    } else {
                        log(errorMsg.actionNotAvailable, 'setContainerOffset');
                    }

                    return _slidr;
                };

                _slidr.attach = function() {
                    if (_initialized) {
                        return _slidr;
                    }

                    var baseTop = _slidr.$container.position().top,
                        baseLeft = _slidr.$container.position().left;

                    _slidr.$container.css({
                        position: 'relative',
                        top: baseTop,
                        left: baseLeft
                    });

                    if (_slidr.$container.data('defaultLeft') === undefined || _slidr.$container.data('defaultTop') === undefined) {
                        _slidr.$container.data('defaultLeft', baseLeft);
                        _slidr.$container.data('currentLeft', baseLeft);
                        _slidr.$container.data('defaultTop', baseTop);
                        _slidr.$container.data('currentTop', baseTop);
                    }

                    _slidr.$container.data('sliding', false);

                    // Back Button
                    _slidr.$prevBtn.on('click.slidr', function (e) {
                        e.preventDefault();
                        _slidr.stop();
                        _slidr.gotoGroup(_currentGroupIndex - 1);
                    });

                    // Next Button
                    _slidr.$nextBtn.addClass(_slidr.isActiveCssClass);
                    _slidr.$nextBtn.on('click.slidr', function (e) {
                        e.preventDefault();
                        _slidr.stop();
                        _slidr.gotoGroup(_currentGroupIndex + 1);
                    });

                    // Initialized Flag
                    _initialized = true;

                    // Custom event
                    _slidr.onInitialized();

                    // AutoPlay feature
                    if (_slidr.autoPlay !== 'no' && _slidr.autoPlayTimer > 0) {
                        _autoPlayState = 'active';
                        _slidr.play(_slidr.autoPlayTimer);
                    }

                    return _slidr;
                };

                _slidr.play = function (autoPlayTimer) {
                    if (_initialized && _slidr.$items.length > _slidr.itemsPerGroup) {

                        if (_autoPlayState === 'active') {
                            _intervalFn = setInterval(function () {
                                if (_currentGroupIndex < _slidr.getLastGroupIndex()) {
                                    _slidr.gotoGroup(_currentGroupIndex + 1);
                                } else {
                                    if (_slidr.autoPlay === 'once') {
                                        _autoPlayState = 'done';
                                        _slidr.stop();
                                    }
                                    _slidr.gotoGroup(0);
                                }

                            }, autoPlayTimer);
                        }

                    } else {
                        log(errorMsg.actionNotAvailable, 'play');
                    }

                    return _slidr;
                };

                _slidr.stop = function() {
                    if (_initialized) {
                        clearInterval(_intervalFn);
                    } else {
                        log(errorMsg.actionNotAvailable, 'stop');
                    }

                    return _slidr;
                };

                _slidr.prev = function (fxAlternate) {
                    if (_initialized) {

                        if (_slidr.$items.length > _slidr.itemsPerGroup) {
                            _slidr.stop();
                            _slidr.gotoGroup(_currentGroupIndex - 1, fxAlternate);
                        }

                    } else {
                        log(errorMsg.actionNotAvailable, 'prev');
                    }

                    return _slidr;
                };

                _slidr.next = function (fxAlternate) {
                    if (_initialized) {

                        if (_slidr.$items.length > _slidr.itemsPerGroup) {
                            _slidr.stop();
                            _slidr.gotoGroup(_currentGroupIndex + 1, fxAlternate);
                        }

                    } else {
                        log(errorMsg.actionNotAvailable, 'next');
                    }

                    return _slidr;
                };

                _slidr.first = function (fxAlternate) {
                    if (_initialized) {

                        if (_slidr.$items.length > _slidr.itemsPerGroup && _currentGroupIndex > 0) {
                            _slidr.stop();
                            _slidr.gotoGroup(0, fxAlternate);
                        }

                    } else {
                        log(errorMsg.actionNotAvailable, 'first');
                    }

                    return _slidr;
                };

                _slidr.last = function (fxAlternate) {
                    if (_initialized) {

                        if (_slidr.$items.length > _slidr.itemsPerGroup && _currentGroupIndex < _slidr.getLastGroupIndex()) {
                            _slidr.stop();
                            _slidr.gotoGroup(_slidr.getLastGroupIndex(), fxAlternate);
                        }

                    } else {
                        log(errorMsg.actionNotAvailable, 'last');
                    }

                    return _slidr;
                };

                _slidr.closest = function (fxAlternate) {
                    if (_initialized) {

                        var containerX = _slidr.$container.parent().width() / 2,
                            containerY = _slidr.$container.parent().height() / 2,
                            closestItem = -1,
                            shortestDistance = 0;

                        _slidr.$items.each(function (i) {
                            var itemX = $(this).position().left + $(this).width() / 2 + _slidr.$container.position().left,
                                itemY = $(this).position().top + $(this).height() / 2 + _slidr.$container.position().top;

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

                        _slidr.gotoGroup(_slidr.getGroupIndexFromItemIndex(closestItem), fxAlternate);

                    } else {
                        log(errorMsg.actionNotAvailable, 'closest');
                    }

                    return _slidr;
                };

                _slidr.getGroupIndexFromItemIndex = function (itemIndex) {
                    return Math.ceil((itemIndex + 1) / _slidr.itemsPerGroup) - 1;
                };

                _slidr.gotoGroup = function (groupIndex, fxAlternate) {
                    if (_initialized) {

                        if (groupIndex >= 0 && groupIndex <= _slidr.getLastGroupIndex()) {

                            var fxDuration, fxEasing, fxDebounce;

                            if (fxAlternate) {
                                fxDuration = _slidr.fxAlternateDuration;
                                fxEasing = _slidr.fxAlternateEasing;
                                fxDebounce = _slidr.fxAlternateDebounce;
                            } else {
                                fxDuration = _slidr.fxDuration;
                                fxEasing = _slidr.fxEasing;
                                fxDebounce = _slidr.fxDebounce;
                            }

                            if (_slidr.$container.data('sliding') !== true || !fxDebounce) {

                                if (fxAlternate) {
                                    // Custom event
                                    _slidr.onAlternateBeforeSliding();

                                    _slidr.$container.addClass(_slidr.alternateAnimateCssClass);
                                } else {
                                    // Custom event
                                    _slidr.onBeforeSliding();

                                    _slidr.$container.addClass(_slidr.animateCssClass);
                                }

                                _currentGroupIndex = groupIndex;
                                var offset = _slidr.getContainerOffset(groupIndex);

                                _slidr.$container.data('sliding', true);
                                _slidr.animate(offset, fxDuration, fxEasing);

                                setTimeout(function () {
                                    _slidr.$container.data('currentTop', offset.top);
                                    _slidr.$container.data('currentLeft', offset.left);

                                    if (fxAlternate) {
                                        _slidr.$container.removeClass(_slidr.alternateAnimateCssClass);

                                        // Custom event
                                        _slidr.onAlternateCompleteSliding();
                                    } else {
                                        _slidr.$container.removeClass(_slidr.animateCssClass);

                                        // Custom event
                                        _slidr.onCompleteSliding();
                                    }

                                    _slidr.$container.data('sliding', false);
                                }, fxDuration);

                            }
                        }

                    } else {
                        log(errorMsg.actionNotAvailable, 'gotoGroup');
                    }

                    return _slidr;
                };

                _slidr.animate = function (offset, duration, easing) {
                    if (_initialized) {

                        if (typeof duration === 'undefined') {
                            duration = _slidr.fxDuration;
                        }

                        if (typeof easing === 'undefined') {
                            easing = _slidr.fxEasing;
                        }

                        _slidr.$container.stop(true).animate({
                            top: offset.top + 'px',
                            left: offset.left + 'px'
                        }, duration, easing);
                    } else {
                        log(errorMsg.actionNotAvailable, 'animate');
                    }

                    return _slidr;
                };

                _slidr.detach = function () {
                    if (!_initialized) {
                        return;
                    }

                    _slidr.stop();
                    _currentGroupIndex = 0;

                    var offset = {
                        left: _slidr.$container.data('defaultLeft'),
                        top: _slidr.$container.data('defaultTop')
                    };

                    _slidr.$container.stop().css(offset);
                    _slidr.animate(offset, 0, 'linear');

                    // Remove Custom Class and Events on Buttons
                    _slidr.$prevBtn.off('.slidr').removeClass(_slidr.isActiveCssClass);
                    _slidr.$nextBtn.off('.slidr').removeClass(_slidr.isActiveCssClass);

                    // Remove SlidrInstance
                    _slidr.$context.removeData('Slidr');

                    return _slidr;
                };

                _slidr.reset = function () {

                    // Detach if initialized
                    if (_initialized) {
                        _slidr.detach();
                    }

                    _initialized = false;

                    // Attach
                    _slidr.attach();

                    return _slidr;
                };

                function log() {
                    if (_slidr.verbose && arguments.length > 0) {
                        var s = arguments[0];
                        for (var i = 1; i < arguments.length; i++) {
                            var reg = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
                            s = s.replace(reg, arguments[i]);
                        }
                        console.log(s);
                    }
                }
            }

            // Get/Set the Slidr instance
            var slidr = $(this).data('Slidr');
            if (!slidr) {
                slidr = new Slidr($(this).first());
                $(this).data('Slidr', slidr);
            }

            // Merge optional properties
            if (typeof options === 'object') {
                for (var option in options) {
                    slidr[option] = options[option];
                }
            }

            // Initialization
            if (!slidr.isInitialized()) {
                slidr.attach();
            }

            return slidr;
        }
    });
})(jQuery);

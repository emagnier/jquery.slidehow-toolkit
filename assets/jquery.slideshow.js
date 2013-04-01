/**
* Slideshow
* © Orckestra
*/

(function($) {
	jQuery.fn.extend({
		slideshow: function(action, options) {
			"use strict";

			// Init errors messages
			var errorMsg = {
				alreadyInitialized: 'Slideshow: already initialized.',
				btnsAlreadyInitialized: 'Slideshow: buttons already initialized.',
				actionNotAvailable: 'Slideshow: {0} action is called but the slideshow is not yet initialized.',
				jQuerySelectorIsIncorrect: 'Slideshow: incorrect jQuery selector.'
			};

			// Init vars
			var $context = $(this).first(),
				defaults = {
					// jQuery Selectors
					$container: $(),
					$items: $(),
					$prevBtn: $(),
					$nextBtn: $(),

					// Auto Play
					autoPlay: 'no', // no, yes, once
					autoPlayTimer: 6000,

					// Slide Effects
					itemsPerGroup: 1,
					fxDuration: 800,
					fxEasing: 'easeOutQuint',

					// Custom Events
					onInitialized: function (objContext) {},
					onCompleteSliding: function (objContext) {},
					onBeforeSliding: function (objContext) {},

					// Debug Mode
					debug: false
				},
				opt,
				maxView = 0;

			// Init opt object
			if (typeof options == 'object') {
				if (typeof eval($context.data('slideshowOpt')) == 'object' && $context.data('slideshow') == 'initialized') {
					opt = $.extend({}, eval($context.data('slideshowOpt')), options);
				} else {
					opt = $.extend({}, defaults, options);
				}
				$context.data('slideshowOpt', opt);
			} else if (typeof eval($context.data('slideshowOpt')) == 'object' && $context.data('slideshow') == 'initialized') {
				opt = $.extend({}, defaults, eval($context.data('slideshowOpt')));
			} else {
				opt = defaults;
			}

			// Return Current Context Variables
			function getObjContext() {
				return {
					currentView: parseInt($context.data('currentView')),
					maxView: maxView,
					opt: opt
				};
			}

			// Stop the AutoPlay feature
			function clearSlideshowTimer() {
				clearInterval($context.data('intervalFn'));
			}

			// Start the AutoPlay feature
			function setSlideshowTimer() {
				$context.data('intervalFn', setInterval(function() {
					var currentView = parseInt($context.data('currentView'));

					if (currentView < maxView) {
						setSliderOffset(currentView + 1);
					} else {
						if (opt.autoPlay == 'once') {
							$context.data('autoPlayState', 'done');
							clearSlideshowTimer();
						}
						setSliderOffset(0);
					}
				}, opt.autoPlayTimer));
			}

			function setSliderOffset(index) {
				if (index >= 0 && index <= maxView) {
					// Custom event
					opt.onBeforeSliding(getObjContext());

					$context.data('currentGroupIndex', index);

					var newLeft = parseInt(opt.$container.data('defaultLeft')) - $(opt.$items[index]).position().left,
						newTop = parseInt(opt.$container.data('defaultTop')) - $(opt.$items[index]).position().top;

					setTimeout(function() {
						checkActiveButtons();
					}, opt.fxDuration / 2);

					opt.$container.stop().animate({
						left: newLeft + 'px',
						top: newTop + 'px'
					}, opt.fxDuration, opt.fxEasing, function() {
						opt.$container.data('currentLeft', newLeft);
						opt.$container.data('currentTop', newTop);

						// Custom event
						opt.onCompleteSliding(getObjContext());
					});
				}
			}

			// Set an active CssClass on the buttons
			function checkActiveButtons() {
				var currentView = getObjContext().currentGroupIndex;

				if (currentView == 0) {
					opt.$prevBtn.removeClass('is-active');
				} else {
					opt.$prevBtn.addClass('is-active');
				}

				if (currentView == maxView) {
					opt.$nextBtn.removeClass('is-active');
				} else {
					opt.$nextBtn.addClass('is-active');
				}
			}

			// Initialize back next buttons
			function initButtons() {
				if ($context.data('slideshowButtons') != 'initialized') {
					$context.data('slideshowButtons', 'initialized');

					var currentView = getObjContext().currentGroupIndex;

					// Back Button
					opt.$prevBtn.on('click.slideshow', function(e) {
						e.preventDefault();
						clearSlideshowTimer();
						setSliderOffset(currentView - 1);
					});

					// Next Button
					opt.$nextBtn.addClass('is-active');
					opt.$nextBtn.on('click.slideshow', function(e) {
						e.preventDefault();
						clearSlideshowTimer();
						setSliderOffset(currentView + 1);
					});
				} else {
					if (opt.debug) {
						console.log(errorMsg.btnsAlreadyInitialized);
					}
				}
			}

			function unInitButtons() {
				opt.$prevBtn.off('.slideshow').removeClass('is-active');
				opt.$nextBtn.off('.slideshow').removeClass('is-active');
				$context.removeData('slideshowButtons', 'initialized');
			}

			// Initialize the slideshow
			function init() {
				if ($context.data('slideshow') != 'initialized') {
					$context.data('slideshow', 'initialized');

					// Get Current Pager View
					$context.data('currentGroupIndex', 0);
					$context.data('lastGroupIndex', maxView);
					$context.data('autoPlayState', 'disable');

					// Don't bind events and mechanic if it's not necessary
					if (opt.$items.length > opt.itemsPerGroup) {

						// Initialize styles & datas for the slider
						var baseTop = isNaN(parseFloat(opt.$container.css('top'))) ? 0 : opt.$container.css('top'),
							baseLeft = isNaN(parseFloat(opt.$container.css('left'))) ? 0 : opt.$container.css('left');

						opt.$container.css({
							position: 'absolute',
							top: baseTop,
							left: baseLeft
						});

						if (opt.$container.data('defaultLeft') == undefined || opt.$container.data('defaultTop') == undefined) {
							opt.$container.data('defaultLeft', baseLeft);
							opt.$container.data('currentLeft', baseLeft);
							opt.$container.data('defaultTop', baseTop);
							opt.$container.data('currentTop', baseTop);
						}

						// AutoPlay feature
						if (opt.autoPlay != 'no' && opt.autoPlayTimer > 0) {
							$context.data('autoPlayState', 'active');
							setSlideshowTimer();
						}
					}

				} else {
					if (opt.debug) {
						console.log(errorMsg.alreadyInitialized);
					}
				}
			}

			if ($context.length == 1) {

				maxView = Math.ceil(opt.$items.length - 1 / opt.itemsPerGroup);

				// Action Calls
				if (typeof action == 'string') {
					var currentView = parseInt($context.data('currentView'));

					// Init
					if (action == 'init') {
						if ($context.data('slideshow') != 'initialized') {
							init();
							initButtons();

							// Custom event
							opt.onInitialized(getObjContext());
						} else {
							if (opt.debug) {
								console.log(errorMsg.alreadyInitialized);
							}
						}
					}

					// Previous
					if (action == 'prev') {
						if ($context.data('slideshow') == 'initialized') {
							clearSlideshowTimer();
							setSliderOffset(currentView - 1);
						} else {
							if (opt.debug) {
								console.log(errorMsg.actionNotAvailable.format('prev'));
							}
						}
					}

					// Next
					if (action == 'next') {
						if ($context.data('slideshow') == 'initialized') {
							clearSlideshowTimer();
							setSliderOffset(currentView + 1);
						} else {
							if (opt.debug) {
								console.log(errorMsg.actionNotAvailable.format('next'));
							}
						}
					}

					// First
					if (action == 'first') {
						if ($context.data('slideshow') == 'initialized') {
							clearSlideshowTimer();
							setSliderOffset(0);
						} else {
							if (opt.debug) {
								console.log(errorMsg.actionNotAvailable.format('first'));
							}
						}
					}

					// Last
					if (action == 'last') {
						if ($context.data('slideshow') == 'initialized') {
							clearSlideshowTimer();
							setSliderOffset(maxView);
						} else {
							if (opt.debug) {
								console.log(errorMsg.actionNotAvailable.format('last'));
							}
						}
					}

					// Reset
					if (action == 'reset') {
						if ($context.data('slideshow') == 'initialized') {

							clearSlideshowTimer();
							$context.data('currentView', 0);

							var left = opt.$container.data('defaultLeft'),
								top = opt.$container.data('defaultTop');

							opt.$container.stop().css({
								'left': left,
								'top': top
							});

							$context.removeData('slideshow');
							checkActiveButtons();

							// Init
							init();
							unInitButtons();
							initButtons();

							// Custom event
							opt.onInitialized(getObjContext());

						} else {
							if (opt.debug) {
								console.log(errorMsg.actionNotAvailable.format('reset'));
							}
						}
					}

					// Stop
					if (action == 'stop') {
						if ($context.data('slideshow') == 'initialized') {
							clearSlideshowTimer();
						} else {
							if (opt.debug) {
								console.log(errorMsg.actionNotAvailable.format('stop'));
							}
						}
					}

					// Play
					if (action == 'play') {
						if ($context.data('slideshow') == 'initialized') {
							if ($context.data('autoPlayState') == 'active') {
								setSlideshowTimer();
							}
						} else {
							if (opt.debug) {
								console.log(errorMsg.actionNotAvailable.format('play'));
							}
						}
					}

					// Closest
					if (action == 'closest') {

						var containerX = opt.$container.parent().width() / 2,
							containerY = opt.$container.parent().height() / 2,
							closestItem = -1,
							shortestDistance = 0;

						opt.$items.each(function(i) {
							var itemX = $(this).position().left + $(this).width() / 2 + opt.$container.position().left,
								itemY = $(this).position().top + $(this).height() / 2 + opt.$container.position().top;

							var dx = containerX - itemX;
							var dy = containerY - itemY;
							var distance = Math.sqrt(dx * dx + dy * dy);

							if (i == 0) {
								shortestDistance = distance;
								closestItem = i;
							}

							if (shortestDistance > distance) {
								shortestDistance = distance;
								closestItem = i;
							}
						});

						setSliderOffset(closestItem)
					}
				}

				if (typeof action == 'number') {
					if ($context.data('slideshow') == 'initialized') {
						setSliderOffset(action - 1);
					} else {
						if (opt.debug) {
							console.log(errorMsg.actionNotAvailable.format('index number'));
						}
					}
				}

			// Probably incorrect selector
			} else {
				if (opt.debug) {
					console.log(errorMsg.jQuerySelectorIsIncorrect);
				}
			}

			return this;
		}
	});
})(jQuery);
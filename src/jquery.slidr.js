/**
 * Slidr
 * © Etienne Magnier
 */

(function($) {
	jQuery.fn.extend({
		slidr: function(options) {
			"use strict";

			// Init errors messages
			var errorMsg = {
				alreadyInitialized: 'Slidr: already initialized.',
				btnsAlreadyInitialized: 'Slidr: buttons already initialized.',
				actionNotAvailable: 'Slidr: {0} action is called but the Slidr is not yet initialized.',
				jQuerySelectorIsIncorrect: 'Slidr: incorrect jQuery selector.'
			};

			// Init vars
			var $context = $(this).first(),
				defaults = {
					// jQuery Selectors
					$container: $(),
					$items: $(),

					// Optional Buttons
					$prevBtn: $(),
					$nextBtn: $(),
					isActiveCssClass: 'is-active',

					// Auto Play
					autoPlay: 'no', // no, yes, once
					autoPlayTimer: 6000,

					// Slide Effects
					itemsPerGroup: 1,
					fxDuration: 600,
					fxEasing: 'easeInOutCirc',
					fxDebounce: false,
					fxAlternateDuration: 200,
					fxAlternateEasing: 'easeOutCirc',
					fxAlternateDebounce: true,
					animateCssClass: '',
					alternateAnimateCssClass: '',

					// Custom Events
					onInitialized: function (objContext) {},
					onBeforeSliding: function (objContext) {},
					onAlternateBeforeSliding: function (objContext) {},
					onCompleteSliding: function (objContext) {},
					onAlternateCompleteSliding: function (objContext) {},

					// Debug Mode
					debug: false
				},
				opt,
				initialized = typeof $context.data('SlidrInstance') == 'object';

			// Init opt object
			if (typeof options == 'object') {
				if (typeof eval($context.data('SlidrOptions')) == 'object' && initialized) {
					opt = $.extend({}, eval($context.data('SlidrOptions')), options);
				} else {
					opt = $.extend({}, defaults, options);
				}
				$context.data('SlidrOptions', opt);
			} else if (typeof eval($context.data('SlidrOptions')) == 'object' && initialized) {
				opt = $.extend({}, defaults, eval($context.data('SlidrOptions')));
			} else {
				opt = defaults;
			}

			var lastGroupIndex = Math.ceil(opt.$items.length / opt.itemsPerGroup) - 1;

			function log() {
				if (opt.debug && arguments.length > 0) {
					var s = arguments[0];
					for (var i = 1; i < arguments.length; i++) {
						var reg = new RegExp("\\{" + (i - 1) + "\\}", "gm");
						s = s.replace(reg, arguments[i]);
					}
					console.log(s);
				}
			}

			var fn = {

				// Return Current Context Informations
				getContextInfo: function () {
					return {
						currentGroupIndex: parseInt($context.data('currentGroupIndex')),
						lastGroupIndex: lastGroupIndex,
						opt: opt
					};
				},

				// Set an active CssClass on the buttons
				checkActiveButtons: function(isActiveCssClass) {
					if (initialized) {
						var currentGroupIndex = fn.getContextInfo().currentGroupIndex;

						if (currentGroupIndex == 0) {
							opt.$prevBtn.removeClass(isActiveCssClass);
						} else {
							opt.$prevBtn.addClass(isActiveCssClass);
						}

						if (currentGroupIndex == lastGroupIndex) {
							opt.$nextBtn.removeClass(isActiveCssClass);
						} else {
							opt.$nextBtn.addClass(isActiveCssClass);
						}

					} else {
						log(errorMsg.actionNotAvailable, 'checkActiveButtons');
					}

					return $context;
				},

				groupIndexToFirstItemIndexInGroup: function(groupIndex) {
					return ((groupIndex + 1) * opt.itemsPerGroup - (opt.itemsPerGroup - 1)) - 1;
				},

				itemIndexToGroupIndex: function(itemIndex) {
					return Math.ceil((itemIndex + 1) / opt.itemsPerGroup) - 1;
				},

				init: function() {
					if (!initialized) {
						initialized = true;

						$context.data('currentGroupIndex', 0);
						$context.data('lastGroupIndex', lastGroupIndex);
						$context.data('autoPlayState', 'disabled');

						// Don't bind events and mechanic if it's not necessary
						if (opt.$items.length > opt.itemsPerGroup) {

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
								fn.play(opt.autoPlayTimer);
							}

							// Back Button
							opt.$prevBtn.on('click.slidr', function(e) {
								e.preventDefault();
								fn.stop().goto(fn.getContextInfo().currentGroupIndex - 1);
							});

							// Next Button
							opt.$nextBtn.addClass(opt.isActiveCssClass);
							opt.$nextBtn.on('click.slidr', function(e) {
								e.preventDefault();
								fn.stop().goto(fn.getContextInfo().currentGroupIndex + 1);
							});

							// Custom event
							opt.onInitialized(fn.getContextInfo());
						}

					} else {
						log(errorMsg.alreadyInitialized);
					}

					return $context;
				},

				reset: function() {
					if (initialized) {

						fn.stop();
						$context.data('currentGroupIndex', 0);

						var left = opt.$container.data('defaultLeft'),
							top = opt.$container.data('defaultTop');

						opt.$container.stop().css({
							'left': left,
							'top': top
						});

						$context.removeData('SlidrInstance');
						fn.checkActiveButtons(opt.isActiveCssClass);

						// Remove Custom Class and Events on Buttons
						opt.$prevBtn.off('.slidr').removeClass(opt.isActiveCssClass);
						opt.$nextBtn.off('.slidr').removeClass(opt.isActiveCssClass);

						// Create an instance for this slideshow
						$context.data('SlidrInstance', fn);
						fn = $context.data('SlidrInstance');

						initialized = false;

						// Init
						fn.init();

						// Custom event
						opt.onInitialized(fn.getContextInfo());

					} else {
						log(errorMsg.actionNotAvailable, 'reset');
					}

					return $context;
				},

				setContainerOffset: function(offset) {
					if (initialized) {
						offset = offset || {};

						if (typeof offset.top == undefined) {
							offset.top = opt.$container.position().top;
						}

						if (typeof offset.left == undefined) {
							offset.left = opt.$container.position().left;
						}

						fn.stop();
						fn.animate(offset, 0, 'linear');

					} else {
						log(errorMsg.actionNotAvailable, 'setContainerOffset');
					}

					return $context;
				},

				getContainerOffset: function(groupIndex) {
					groupIndex = Math.min(groupIndex, lastGroupIndex);
					groupIndex = Math.max(groupIndex, 0);
					var itemIndex = fn.groupIndexToFirstItemIndexInGroup(groupIndex);

					return {
						top: parseInt(opt.$container.data('defaultTop')) - $(opt.$items[itemIndex]).position().top,
						left: parseInt(opt.$container.data('defaultLeft')) - $(opt.$items[itemIndex]).position().left
					}
				},

				animate: function(offset, duration, easing) {
					if (initialized) {
						if (typeof duration == undefined) {
							duration = opt.fxDuration;
						}

						if (typeof easing == undefined) {
							easing = opt.fxEasing;
						}

						opt.$container.stop(true).animate({
							top: offset.top + 'px',
							left: offset.left + 'px'
						}, duration, easing);
					} else {
						log(errorMsg.actionNotAvailable, 'animate');
					}

					return $context;
				},

				// Go to a specific slide group
				goto: function(groupIndex, fxAlternate) {
					if (initialized ) {

						if (groupIndex >= 0 && groupIndex <= lastGroupIndex) {

							fxAlternate = fxAlternate || false;
							var fxDuration, fxEasing, fxDebounce;

							if (fxAlternate) {
								fxDuration = opt.fxAlternateDuration;
								fxEasing = opt.fxAlternateEasing;
								fxDebounce = opt.fxAlternateDebounce;
							} else {
								fxEasing = opt.fxEasing;
								fxDebounce = opt.fxDebounce;
								opt.$container.addClass(opt.animateCssClass);
							}

							if (opt.$container.data('sliding') != true || !fxDebounce) {

								if (fxAlternate) {
									// Custom event
									opt.onAlternateBeforeSliding(fn.getContextInfo());

									opt.$container.addClass(opt.alternateAnimateCssClass);
								} else {
									// Custom event
									opt.onBeforeSliding(fn.getContextInfo());

									fxDuration = opt.fxDuration;
								}

								$context.data('currentGroupIndex', groupIndex);
								var offset = fn.getContainerOffset(groupIndex);
								fn.checkActiveButtons(opt.isActiveCssClass);

								opt.$container.data('sliding', true);
								fn.animate(offset, fxDuration, fxEasing);

								setTimeout((function() {
									opt.$container.data('currentTop', offset.top);
									opt.$container.data('currentLeft', offset.left);

									if (fxAlternate) {
										opt.$container.removeClass(opt.alternateAnimateCssClass);

										// Custom event
										opt.onAlternateCompleteSliding(fn.getContextInfo());
									} else {
										opt.$container.removeClass(opt.animateCssClass);

										// Custom event
										opt.onCompleteSliding(fn.getContextInfo());
									}

									opt.$container.data('sliding', false);
								}), fxDuration);

							}
						}

					} else {
						log(errorMsg.actionNotAvailable, 'goto');
					}

					return $context;
				},

				// Play
				play: function(autoPlayTimer) {
					if (initialized) {

						if ($context.data('autoPlayState') == 'active') {

							$context.data('intervalFn', setInterval(function() {
								var currentGroupIndex = fn.getContextInfo().currentGroupIndex;

								if (currentGroupIndex < lastGroupIndex) {
									fn.goto(currentGroupIndex + 1);
								} else {
									if (opt.autoPlay == 'once') {
										$context.data('autoPlayState', 'done');
										fn.stop();
									}
									fn.goto(0);
								}
							}, autoPlayTimer));

						}
					} else {
						log(errorMsg.actionNotAvailable, 'play');
					}

					return $context;
				},

				// Stop
				stop: function() {
					if (initialized) {
						clearInterval($context.data('intervalFn'));
					} else {
						log(errorMsg.actionNotAvailable, 'stop');
					}

					return $context;
				},

				// Go to Previous
				prev: function(fxAlternate) {
					if (initialized) {
						var currentGroupIndex = fn.getContextInfo().currentGroupIndex;
						fn.stop();
						fn.goto(currentGroupIndex - 1, fxAlternate);
					} else {
						log(errorMsg.actionNotAvailable, 'prev');
					}

					return $context;
				},

				// Go to Next
				next: function(fxAlternate) {
					if (initialized) {
						var currentGroupIndex = fn.getContextInfo().currentGroupIndex;
						fn.stop();
						fn.goto(currentGroupIndex + 1, fxAlternate);
					} else {
						log(errorMsg.actionNotAvailable, 'next');
					}

					return $context;
				},

				// Go to First
				first: function(fxAlternate) {
					if (initialized) {
						fn.stop();
						fn.goto(0, fxAlternate);
					} else {
						log(errorMsg.actionNotAvailable, 'first');
					}

					return $context;
				},

				// Go to Last
				last: function(fxAlternate) {
					if (initialized) {
						fn.stop();
						fn.goto(lastGroupIndex, fxAlternate);
					} else {
						log(errorMsg.actionNotAvailable, 'last');
					}

					return $context;
				},

				// Go to Closest
				closest: function(fxAlternate) {
					if (initialized) {

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

						fn.goto(fn.itemIndexToGroupIndex(closestItem), fxAlternate);

					} else {
						log(errorMsg.actionNotAvailable, 'closest');
					}

					return $context;
				}

			};

			if ($context.first().length == 1 && !initialized) {
				// Create an instance for this slideshow
				$context.data('SlidrInstance', fn);
				fn = $context.data('SlidrInstance');
				fn.init();
			} else {
				// Retrieve the instance of the slideshow
				fn = $context.data('SlidrInstance');
			}

			// Probably incorrect selector
			if ($context.first().length != 1) {
				log(errorMsg.jQuerySelectorIsIncorrect);
			}

			return fn;
		}
	});
})(jQuery);
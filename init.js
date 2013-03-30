

$('.js-slideshow').each(function() {
	var $context = $(this),
		isActiveCssClass = 'is-active';

	var options = {
		// jQuery Selectors
		$slider: $('.js-slideshow-slider-wrapper', $context),
		$items: $('.js-slideshow-slider-wrapper > *', $context),

		// Auto Play
		autoPlay: 'no',
		autoPlayTimer: 1000,

		// Slide Effects
		itemsToSlide: 1,
		fxDuration: 800,
		fxEasing: 'easeOutQuint',

		debug: true
	};

	// Initialize the slideshow
	$context.slideshow('init', options);

	// Pause the slideshow on mouse hover
	if ($context.data('pause-on-mousehover')) {
		$context.find('.js-slideshow-mask').on({
			mouseenter: function() {
				$context.slideshow('stop');
			},
			mouseleave: function() {
				$context.slideshow('play');
			}
		});
	}

	function handleHammer(ev) {
		// disable browser scrolling
		ev.gesture.preventDefault();

		if (ev.type == 'dragright' || ev.type == 'dragleft') {
			$context.slideshow('stop');
			var left = options.$slider.data('currentLeft') + ev.gesture.deltaX;

			//if(Modernizr.csstransforms3d) {
			//	options.$slider.css("transform", "translate3d("+ left +"px,0,0) scale3d(1,1,1)");
			//}
			//else
			//if(Modernizr.csstransforms) {
			//	options.$slider.css("transform", "translate("+ left +"px,0)");
			//}
			//else {
				options.$slider.css('left', left);
			//}
		}

		if (ev.type == 'swipeleft' && $context.data('currentView') < $context.data('maxView')) {
			$context.slideshow('next');
			ev.gesture.stopDetect();
		}

		if (ev.type == 'swiperight' && $context.data('currentView') > 0) {
			$context.slideshow('prev');
			ev.gesture.stopDetect();
		}

		if (ev.type == 'release' && ev.gesture.deltaX != 0) {
			$context.slideshow('closest');
		}
	}

	$context.hammer({ drag_lock_to_axis: true })
		.on("release swipeleft swiperight dragleft dragright", handleHammer);

});
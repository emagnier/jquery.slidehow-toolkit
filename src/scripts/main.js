(function() {
    'use strict';

    $(document).ready(function() {

        var $slideshow = $('.js-slideshow');

        var options = {
            $slider: $('.js-slideshow-slider', $slideshow),
            $items: $('.js-slideshow-slider > *', $slideshow),
            //autoPlay: 'once',
            autoPlayTimer: 1000,
            pauseOnMouseOver: true,
            itemsPerGroup: 1,
            throttleItemTransitions: false,
            verbose: true
        };

        // Initialize the slideshow
        $slideshow.slideshow(options);

        function handleHammer(ev) {
            // Disable browser scrolling
            ev.gesture.preventDefault();

            if (options.$slider.data('sliding') !== true && (ev.type === 'dragright' || ev.type === 'dragleft')) {
                $slideshow.slideshow().stop();
                var left = options.$slider.data('currentLeft') + ev.gesture.deltaX;
                $slideshow.slideshow().setSliderOffset({left: left});
            }

            if (ev.type === 'swipeleft' && $slideshow.data('currentGroupIndex') < $slideshow.data('lastGroupIndex')) {
                $slideshow.slideshow().next();
                ev.gesture.stopDetect();
            }

            if (ev.type === 'swiperight' && $slideshow.data('currentGroupIndex') > 0) {
                $slideshow.slideshow().prev();
                ev.gesture.stopDetect();
            }

            if (ev.type === 'release' && ev.gesture.deltaX !== 0) {
                $slideshow.slideshow().closest();
            }
        }

        options.$slider.hammer({ 'drag_lock_to_axis': true }).on('release swipeleft swiperight dragleft dragright', handleHammer);

        $('.js-slideshow-prev').on('click', function(e) {
            e.preventDefault();
            $slideshow.slideshow().prev();
        });

        $('.js-slideshow-next').on('click', function(e) {
            e.preventDefault();
            $slideshow.slideshow().next();
        });

        // Disable the default anchor behaviour
        $('a[href=#]').click(function(e) {
            e.preventDefault();
        });
    });
})();
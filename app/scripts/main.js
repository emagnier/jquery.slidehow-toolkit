(function() {
    'use strict';

    $(document).ready(function() {

        $('.js-slideshow').each(function() {
            var $context = $(this);

            var options = {
                $container: $('.js-slideshow-slider-wrapper', $context),
                $items: $('.js-slideshow-slider-wrapper > *', $context),
                autoPlay: 'once',
                autoPlayTimer: 1000,
                itemsPerGroup: 2,
                verbose: true
            };

            // Initialize the slideshow
            $context.slidr(options);

            // Pause the slideshow on mouse hover
            if ($context.data('pause-on-mousehover')) {
                options.$container.on({
                    mouseenter: function() {
                        $context.slidr().stop();
                    },
                    mouseleave: function() {
                        $context.slidr().play();
                    }
                });
            }

            function handleHammer(ev) {
                // disable browser scrolling
                ev.gesture.preventDefault();

                if (options.$container.data('sliding') !== true && (ev.type === 'dragright' || ev.type === 'dragleft')) {
                    $context.slidr().stop();
                    var left = options.$container.data('currentLeft') + ev.gesture.deltaX;
                    $context.slidr().setContainerOffset({left: left});
                }

                if (ev.type === 'swipeleft' && $context.data('currentGroupIndex') < $context.data('lastGroupIndex')) {
                    $context.slidr().next(true);
                    ev.gesture.stopDetect();
                }

                if (ev.type === 'swiperight' && $context.data('currentGroupIndex') > 0) {
                    $context.slidr().prev(true);
                    ev.gesture.stopDetect();
                }

                if (ev.type === 'release' && ev.gesture.deltaX !== 0) {
                    $context.slidr().closest(true);
                }
            }

            options.$container.hammer({ 'drag_lock_to_axis': true }).on('release swipeleft swiperight dragleft dragright', handleHammer);

        });

    });
})();
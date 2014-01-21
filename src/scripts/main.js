(function() {
    'use strict';

    $(document).ready(function() {

        $('.js-slideshow').each(function() {
            var $this = $(this);

            var options = {
                $container: $('.js-slideshow-container', $this),
                $items: $('.js-slideshow-container > *', $this),
                autoPlay: 'once',
                autoPlayTimer: 1000,
                itemsPerGroup: 2,
                verbose: true
            };

            // Initialize the slideshow
            $this.slideshow(options);

            // Pause the slideshow on mouse hover
            options.$container.on({
                'mouseenter touchstart': function() {
                    $this.slideshow().stop();
                },
                'mouseleave touchend': function() {
                    $this.slideshow().play();
                }
            });

            function handleHammer(ev) {
                // disable browser scrolling
                ev.gesture.preventDefault();

                if (options.$container.data('sliding') !== true && (ev.type === 'dragright' || ev.type === 'dragleft')) {
                    $this.slideshow().stop();
                    var left = options.$container.data('currentLeft') + ev.gesture.deltaX;
                    $this.slideshow().setContainerOffset({left: left});
                }

                if (ev.type === 'swipeleft' && $this.data('currentGroupIndex') < $this.data('lastGroupIndex')) {
                    $this.slideshow().next(true);
                    ev.gesture.stopDetect();
                }

                if (ev.type === 'swiperight' && $this.data('currentGroupIndex') > 0) {
                    $this.slideshow().prev(true);
                    ev.gesture.stopDetect();
                }

                if (ev.type === 'release' && ev.gesture.deltaX !== 0) {
                    $this.slideshow().closest(true);
                }
            }

            options.$container.hammer({ 'drag_lock_to_axis': true }).on('release swipeleft swiperight dragleft dragright', handleHammer);
        });

        // Disable the default anchor behaviour
        $('a[href=#]').click(function(e) {
            e.preventDefault();
        });
    });
})();
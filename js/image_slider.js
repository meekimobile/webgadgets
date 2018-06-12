const getParams = query => {
    if (!query) {
        return {};
    }

    return (/^[?#]/.test(query) ? query.slice(1) : query)
        .split('&')
        .reduce((params, param) => {
            let [key, value] = param.split('=');
            params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
            return params;
        }, {});
};

function Prefs(q) {
    this.params = getParams(q);
    this.getString = function (key) {
        return this.params[key];
    };
    this.getInt = function (key, defaultVal) {
        var i = parseInt(this.params[key]);
        return isNaN(i) ? defaultVal : i;
    };
    this.getBool = function (key) {
        return this.params[key] == 'true';
    };
}

function isiPhone() {
    var iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
    return iOS;
}

function mouseDown(event) {
    event.preventDefault();
    $('#debug').html('mouseDown clientX ' + event.clientX);
    startMouseX = event.clientX;
    startScrollLeft = $('#carousel').scrollLeft();
    $('#carousel').stop();
}

function mouseMove(event) {
    event.preventDefault();

    if (startMouseX > -1) {
        var itemsScrollLeft = $('#carousel').scrollLeft();
        dx = event.clientX - startMouseX;
        $('#carousel').scrollLeft(startScrollLeft - dx);
        $('#debug').html('mouseMove itemsScrollLeft ' + itemsScrollLeft + ' dx ' + dx);
    }
}

function mouseUp(event) {
    startMouseX = -1;
    event.preventDefault();

    if (prefs.getBool('snapPage')) {
        var itemsScrollLeft = $('#carousel').scrollLeft();
        dx = itemsScrollLeft - startScrollLeft;
        $('#debug').html('mouseUp itemsScrollLeft ' + itemsScrollLeft + ' dx ' + dx);
        if (dx < 0) {
            nextSlide(Direction.LEFT);
        } else if (dx > 0) {
            nextSlide(Direction.RIGHT);
        }
    }

    setupAutoScroll();
}

function touchStart(event) {
    startScrollLeft = $('#carousel').scrollLeft();
    $('#debug').html('touchStart startScrollLeft ' + startScrollLeft);
    $('#carousel').stop();
}

function touchMove(event) {
}

function touchEnd(event) {
    if (prefs.getBool('snapPage')) {
        var itemsScrollLeft = $('#carousel').scrollLeft();
        dx = itemsScrollLeft - startScrollLeft;
        $('#debug').html('touchEnd itemsScrollLeft ' + itemsScrollLeft + ' dx ' + dx);
        if (dx < 0) {
            nextSlide(Direction.LEFT);
        } else if (dx > 0) {
            nextSlide(Direction.RIGHT);
        }
    }

    setupAutoScroll();
}

function htmlDecode(input) {
    var e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes[0].nodeValue;
}

function autoScroll() {
    console.log('autoScroll items.width ' + $('#items').width() + ' slider.width ' + window.innerWidth);
    var autoScrollDuration = parseInt(prefs.getString('autoScrollDuration'));
    var scrollLeft = $('#carousel').scrollLeft();
    var maxScrollLeft = $('#items').width() - window.innerWidth;
    var targetScrollLeft;
    if (maxScrollLeft < 0) {
        targetScrollLeft = '0px';
        autoScrollDuration = 0;
    } else if (scrollLeft >= maxScrollLeft) {
        targetScrollLeft = '0px';
    } else if (scrollLeft <= 0) {
        targetScrollLeft = maxScrollLeft + 'px';
    } else {
        targetScrollLeft = maxScrollLeft + 'px';
        autoScrollDuration = autoScrollDuration * (maxScrollLeft - scrollLeft) / maxScrollLeft;
    }
    console.log('autoScroll scrollLeft ' + scrollLeft + ' maxScrollLeft ' + maxScrollLeft + ' targetScrollLeft ' + targetScrollLeft);
    $('#carousel').delay(2000).animate({ 'scrollLeft': targetScrollLeft }, autoScrollDuration * 1000, 'linear', function () {
        autoScroll();
    });
}

function nextSlide(dx, msec) {
    currentSlide = (currentSlide + slideCount + dx) % slideCount;
    var currentSlideScrollLeft = $('#carousel').scrollLeft();
    var newSlideScrollLeft = currentSlide * $('#carousel').width();
    console.log('nextSlide dx ' + dx + '' + slideCount + ' currentSlide ' + currentSlide + ' currentSlideScrollLeft ' + currentSlideScrollLeft + ' newSlideScrollLeft ' + newSlideScrollLeft);
    if (isiPhone()) {
        $('#carousel').animate({ 'scrollLeft': newSlideScrollLeft }, (msec ? msec : 400));
    } else {
        // Iterate to new scrollLeft.
        var startTime = (new Date()).getTime();
        var duration = (msec ? msec : 400);
        var timerInterval = 10;
        var distance = newSlideScrollLeft - currentSlideScrollLeft;
        var dx = distance / (duration / timerInterval);

        var slideTimer = window.setInterval(function () {
            if (dx > 0) {
                if (newSlideScrollLeft > currentSlideScrollLeft) {
                    currentSlideScrollLeft += dx;
                    if (currentSlideScrollLeft > newSlideScrollLeft) {
                        currentSlideScrollLeft = newSlideScrollLeft;
                    }
                    //					console.log('nextSlide currentSlideScrollLeft ' + currentSlideScrollLeft);
                    $('#carousel').scrollLeft(currentSlideScrollLeft);
                } else {
                    window.clearInterval(slideTimer);
                    $('#carousel').scrollLeft(newSlideScrollLeft);
                }
            } else if (dx < 0) {
                if (newSlideScrollLeft < currentSlideScrollLeft) {
                    currentSlideScrollLeft += dx;
                    if (currentSlideScrollLeft < newSlideScrollLeft) {
                        currentSlideScrollLeft = newSlideScrollLeft;
                    }
                    //					console.log('nextSlide currentSlideScrollLeft ' + currentSlideScrollLeft);
                    $('#carousel').scrollLeft(currentSlideScrollLeft);
                } else {
                    window.clearInterval(slideTimer);
                    $('#carousel').scrollLeft(newSlideScrollLeft);
                }
            } else {
                window.clearInterval(slideTimer);
                $('#carousel').scrollLeft(newSlideScrollLeft);
            }
        }, timerInterval);
    }
}

function populateItems() {
    currentSlide = 0;
    slideCount = 0;
    $('#items').empty();
    $('#carousel').height(0);

    var baseUrl = prefs.getString('baseUrl');
    var imageNameList = prefs.getString('imageNameList');
    var imageNames = imageNameList.split(',');

    for (var i = 0; i < imageNames.length; i++) {
        var content = imageNames[i].trim();
        $('#debug').html('parsing pref content' + i + ' ' + content);
        var item = document.createElement('div');
        var itemImg = document.createElement('img');
        itemImg.src = baseUrl + encodeURI(content);
        $(item).append(itemImg);
        $(itemImg).width($(window).width());
        $(itemImg).load(function () {
            if ($(this).height() > $('#carousel').height()) {
                console.log('img height ' + $(this).height());
                $('#carousel').height($(this).height());
                //gadgets.window.adjustHeight();
            }
        });
        $('#items').append(item);
        slideCount++;
    }
}

function resizeItems() {
    $('#carousel').height(0);
    $('#carousel').css('scrollLeft', 0);

    $('#items div img').each(function () {
        var ratio = $(window).width() / $(this).width;
        var newHeight = $(this).height() * ratio;
        $(this).width($(window).width());
        $(this).height(newHeight);
        if ($(this).height() > $('#carousel').height()) {
            $('#carousel').height($(this).height());
            console.log('resize carousel height ' + $('#carousel').height());
            //gadgets.window.adjustHeight();
        }
    });
}

function setupAutoScroll() {
    window.clearInterval(autoScrollTimer);

    if (prefs.getBool('autoScroll')) {
        var autoScrollDuration = parseInt(prefs.getString('autoScrollDuration'));
        autoScrollTimer = window.setInterval(function () { nextSlide(Direction.RIGHT, 500); }, autoScrollDuration * 1000);
    }
}

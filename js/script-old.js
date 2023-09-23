let slideMedia;
let slideMediaType;

// image progress
let imageSlideDuration = 2000;
let imageSlideCurrentTime = 0;
let imageSlideProgressInterval;
let imageSlideProgressIntervalTick = 100;

let slideData = [];
let slideNumTotal;
let currentSlideIndex = 0;
let isSlidePaused = false;

let mediaContainer;

//
function updateProgressBar(currentTime, duration) {
  let pct = !isSlidePaused
    ? currentTime / duration
    : slideMediaType === 'video'
    ? currentTime / duration
    : 0;

  $('.slide-progress-bar').css({
    width: pct * 200 + 'px',
  });
  return pct;
}

// video progress
function onCanPlayVideo() {
  // 브라우저 정책상 음소거가 되어있어야 자동재생이 됨.
  slideMedia.muted = true;
  slideMedia.play();
}

function onTimeUpdateVideo() {
  const { currentTime, duration } = slideMedia;
  let pct = updateProgressBar(currentTime, duration);

  //
  // if (pct > 0.2) nextSlide(); // 테스트용 동영상 플레이 짧게

  // pct가 딱 1.0에 맞아떨어지지 않음
  // if (pct > 0.98) nextSlide();
}
function onEndedVideo() {
  console.log('video end');
  if (isSlidePaused) {
    slideMedia.play();
  } else {
    nextSlide();
  }
}

//
function onImageSlideEnd() {
  console.log('end');
}
function onImageSlideProgressInterval() {
  imageSlideCurrentTime += imageSlideProgressIntervalTick;
  updateProgressBar(imageSlideCurrentTime, imageSlideDuration);
  if (imageSlideCurrentTime >= imageSlideDuration) {
    nextSlide();
  }
}
function setSlideImageProgressInterval() {
  imageSlideCurrentTime = 0;
  imageSlideProgressInterval = setInterval(
    onImageSlideProgressInterval,
    imageSlideProgressIntervalTick
  );
}
//
function nextSlide() {
  if (isSlidePaused) return;

  currentSlideIndex = getNextSlideIndex();
  setSlide(currentSlideIndex);
}
//
function getVideoElement(mediaURL) {
  const video = document.createElement('video');
  video.setAttribute('src', mediaURL);

  // 브라우저 정책상 음소거가 되어있어야 자동재생이 됨.
  // video.setAttribute('autoplay', true);
  // video.setAttribute('muted', true);

  // // loop가 true면 ended 이벤트가 발생안함
  // video.setAttribute('loop', true);

  return video;
}
function getImageElement(mediaURL) {
  const image = document.createElement('img');
  image.setAttribute('src', mediaURL);
  return image;
}

function setSlide(index) {
  //
  clearInterval(imageSlideProgressInterval);

  setStateIndicators(index);
  //
  let content = slideData[index];
  let { type, src } = content;
  slideMediaType = type;
  let mediaURL = src.indexOf('http') >= 0 ? src : '' + src;

  switch (type) {
    case 'video':
      slideMedia = getVideoElement(mediaURL);
      break;
    case 'image':
      slideMedia = getImageElement(mediaURL);
      break;
    default:
      break;
  }

  mediaContainer.innerHTML = '';
  mediaContainer.append(slideMedia);
  //
  if (type == 'video') {
    slideMedia.oncanplay = onCanPlayVideo;
    slideMedia.ontimeupdate = onTimeUpdateVideo;
    slideMedia.onended = onEndedVideo;
    // slideMedia.addEventListener('ended', onEndedVideo);
  }
  if (type == 'image') {
    setSlideImageProgressInterval();
  }
}

function setStateIndicators(index) {
  $('.slide-indicators').children('li').removeClass();
  $('.slide-indicators')
    .children('li')
    .each(function (i, e) {
      if (i == index) $(e).addClass('slide-indicator-active');
    });
}
function createIndicators() {
  let ul = $('.slide-indicators');
  let li;
  for (let i = 0; i < slideNumTotal; i++) {
    li = $('<li></li>');
    li.data('slideIndex', i);
    ul.append(li);
    li.click(onSlideIndicatorClick);
  }
}
function onSlideIndicatorClick() {
  currentSlideIndex = $(this).data('slideIndex');
  setSlide(currentSlideIndex);
}

function getPrevSlideIndex() {
  let index =
    currentSlideIndex - 1 < 0 ? slideNumTotal - 1 : currentSlideIndex - 1;
  return index;
}
function getNextSlideIndex() {
  let index =
    currentSlideIndex + 1 >= slideNumTotal ? 0 : currentSlideIndex + 1;
  return index;
}

function setBtnHandlers() {
  $('.btn-slide-controller-play-pause').click(function (e) {
    isSlidePaused = !isSlidePaused;

    if (isSlidePaused) {
      $(this).children('img').attr('src', '/images/icon_play.png');
    }
    if (!isSlidePaused) {
      $(this).children('img').attr('src', '/images/icon_pause.png');
    }
  });

  $('.btn-slide-controller-prev').click(function (e) {
    currentSlideIndex = getPrevSlideIndex();
    setSlide(currentSlideIndex);
  });
  $('.btn-slide-controller-next').click(function (e) {
    currentSlideIndex = getNextSlideIndex();
    setSlide(currentSlideIndex);
  });
}

//
function createMediaSliderElements(parent) {
  const html = `
  <div class="media-slider">
    <div class="slide-meta">
      <!--  -->
      <div class="slide-progress slide-progress-box">
        <div class="slide-progress slide-progress-bar"></div>
      </div>
      <!--  -->
      <div class="slide-indicators-container">
        <ul class="slide-indicators">
          <!-- li here -->
        </ul>
      </div>
      <!--  -->
      <div class="slide-controller">
        <button class="btn-slide-controller btn-slide-controller-prev">
          <img src="./images/icon_arrow_left.png" />
        </button>
        <button class="btn-slide-controller btn-slide-controller-play-pause">
          <img src="./images/icon_pause.png" />
        </button>
        <button class="btn-slide-controller btn-slide-controller-next">
          <img src="./images/icon_arrow_right.png" />
        </button>
      </div>
    </div>
    <!--  -->
    <div class="media-container" />
  </div>
  `;
  parent.innerHTML = html;
}

// 첫 실행
(async function () {
  const mediaSliderParent = document.querySelector('.media-slider-here-0');
  createMediaSliderElements(mediaSliderParent);
  mediaContainer = mediaSliderParent.querySelector('.media-container');
  const res = await fetch('./slide_data.json');
  slideData = await res.json();
  slideNumTotal = slideData.length;
  createIndicators();
  setBtnHandlers();
  setSlide(currentSlideIndex);
})();

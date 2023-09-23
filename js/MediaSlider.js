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

class MediaSlider {
  //
  #slideData;
  #slideNumTotal;
  #isSlidePaused = false;
  #slideIndicatorsElements = [];
  #currentSlideIndex = 0;
  #imageSlideDuration = 2000;
  #imageSlideCurrentTime = 0;
  #imageSlideProgressInterval;
  #imageSlideProgressIntervalTick = 100;

  #slideMediaType;

  // 주요 HTML 요소들
  #elMediaSliderContainer;
  #elSlideIndicatorsContainer;
  #elMediaContainer;
  #elIndicatorsContainer;
  #elBtnPlayPause;
  #elBtnPrev;
  #elBtnNext;
  #elProgressBar;
  #elSlideMedia;

  /**
   * constructor
   */
  constructor(_mediaSliderParent, _jsonPath) {
    (async () => {
      const res = await fetch(_jsonPath);
      this.#slideData = await res.json();

      //
      const mediaSliderParent = document.querySelector(_mediaSliderParent);

      this.#createMediaSliderElements(mediaSliderParent);
      this.#elMediaSliderContainer =
        mediaSliderParent.querySelector('.media-slider');
      this.#elMediaContainer =
        mediaSliderParent.querySelector('.media-container');
      this.#slideNumTotal = this.#slideData.length;
      //
      this.#elProgressBar = this.#elMediaSliderContainer.querySelector(
        '.slide-progress-bar'
      );
      this.#elIndicatorsContainer =
        this.#elMediaSliderContainer.querySelector('.slide-indicators');

      this.#elBtnPlayPause = this.#elMediaSliderContainer.querySelector(
        '.btn-slide-controller-play-pause'
      );
      this.#elBtnPrev = this.#elMediaSliderContainer.querySelector(
        '.btn-slide-controller-prev'
      );
      this.#elBtnNext = this.#elMediaSliderContainer.querySelector(
        '.btn-slide-controller-next'
      );

      //
      this.#createIndicators();

      //
      this.#elBtnPlayPause.addEventListener(
        'click',
        this.#onClickBtnPlayPause.bind(this)
      );
      this.#elBtnPrev.addEventListener(
        'click',
        this.#onClickBtnPrev.bind(this)
      );
      this.#elBtnNext.addEventListener(
        'click',
        this.#onClickBtnNext.bind(this)
      );

      this.#setSlide(this.#currentSlideIndex);
    })();
  }

  //
  #getPrevSlideIndex() {
    let index =
      this.#currentSlideIndex - 1 < 0
        ? this.#slideNumTotal - 1
        : this.#currentSlideIndex - 1;
    return index;
  }
  #getNextSlideIndex() {
    let index =
      this.#currentSlideIndex + 1 >= this.#slideNumTotal
        ? 0
        : this.#currentSlideIndex + 1;
    return index;
  }

  //
  #createMediaSliderElements(parent) {
    parent.innerHTML = html;
  }

  //
  #createIndicators() {
    this.#elSlideIndicatorsContainer =
      this.#elMediaSliderContainer.querySelector('.slide-indicators');
    let li;
    for (let i = 0; i < this.#slideNumTotal; i++) {
      li = document.createElement('li');
      li.dataset.slideIndex = i;
      this.#elIndicatorsContainer.append(li);
      li.addEventListener('click', this.#onSlideIndicatorClick.bind(this, i));
      this.#slideIndicatorsElements.push(li);
    }
  }

  #setStateIndicators(_index) {
    const lis = this.#elIndicatorsContainer.children; // HTML Collection, 배열과 다르다
    // for...of 구문은 컬렉션 전용입니다.
    // 모든 객체보다는, [Symbol.iterator] 속성이 있는 모든 컬렉션 요소에 대해 이 방식으로 반복합니다.
    let i = 0;
    for (const li of lis) {
      li.classList.contains('slide-indicator-active') &&
        li.classList.remove('slide-indicator-active');
      if (i == _index) li.classList.add('slide-indicator-active');
      i++;
    }
  }

  //
  #onSlideIndicatorClick(i) {
    const li = this.#slideIndicatorsElements[i];
    this.#currentSlideIndex = li.dataset.slideIndex;
    this.#setSlide(this.#currentSlideIndex);
  }

  //
  #onClickBtnPlayPause(e) {
    this.#isSlidePaused = !this.#isSlidePaused;
    const elBtnImg = this.#elBtnPlayPause.querySelector('img');
    const srcIconPlay = '/images/icon_play.png';
    const srcIconPause = '/images/icon_pause.png';

    this.#isSlidePaused
      ? elBtnImg.setAttribute('src', srcIconPlay)
      : elBtnImg.setAttribute('src', srcIconPause);
  }
  #onClickBtnPrev(e) {
    this.#currentSlideIndex = this.#getPrevSlideIndex();
    this.#setSlide(this.#currentSlideIndex);
  }
  #onClickBtnNext(e) {
    this.#currentSlideIndex = this.#getNextSlideIndex();
    this.#setSlide(this.#currentSlideIndex);
  }

  /**
   * #setSlide
   */
  #setSlide(_index) {
    //
    clearInterval(this.#imageSlideProgressInterval);

    this.#setStateIndicators(_index);
    //
    let content = this.#slideData[_index];
    let { type, src } = content;
    let mediaURL = src.indexOf('http') >= 0 ? src : '' + src;
    this.#slideMediaType = type;

    //
    if (this.#elSlideMedia && this.#elSlideMedia.tagName === 'VIDEO') {
      this.#elSlideMedia.oncanplay = null;
      this.#elSlideMedia.ontimeupdate = null;
      this.#elSlideMedia.onended = null;
    }

    switch (type) {
      case 'video':
        this.#elSlideMedia = this.#getVideoElement(mediaURL);
        break;
      case 'image':
        this.#elSlideMedia = this.#getImageElement(mediaURL);
        break;
      default:
        break;
    }

    //
    if (type == 'video') {
      this.#elSlideMedia.oncanplay = this.#onCanPlayVideo.bind(this);
      this.#elSlideMedia.ontimeupdate = this.#onTimeUpdateVideo.bind(this);
      this.#elSlideMedia.onended = this.#onEndedVideo.bind(this);
    }
    if (type == 'image') {
      this.#setSlideImageProgressInterval();
    }

    this.#elMediaContainer.innerHTML = '';
    this.#elMediaContainer.append(this.#elSlideMedia);
  }

  // progress
  #updateProgressBar(_currentTime, _duration) {
    let pct = !this.#isSlidePaused
      ? _currentTime / _duration
      : this.#slideMediaType === 'video'
      ? _currentTime / _duration
      : 0;

    this.#elProgressBar.style.width = pct * 200 + 'px';

    return pct;
  }

  #onCanPlayVideo() {
    // 브라우저 정책상 음소거가 되어있어야 자동재생이 됨.
    this.#elSlideMedia.muted = true;
    this.#elSlideMedia.play();
  }

  #onTimeUpdateVideo() {
    const { currentTime, duration } = this.#elSlideMedia;
    let pct = this.#updateProgressBar(currentTime, duration);

    //
    // if (pct > 0.2) this.#nextSlide(); // 테스트용 동영상 플레이 짧게

    // pct가 딱 1.0에 맞아떨어지지 않음
    // if (pct > 0.98) nextSlide();
  }
  #onEndedVideo() {
    console.log('video end');
    if (this.#isSlidePaused) {
      this.#elSlideMedia.play();
    } else {
      this.#nextSlide();
    }
  }

  //
  #onImageSlideEnd() {
    console.log('end');
  }
  #onImageSlideProgressInterval() {
    this.#imageSlideCurrentTime += this.#imageSlideProgressIntervalTick;
    this.#updateProgressBar(
      this.#imageSlideCurrentTime,
      this.#imageSlideDuration
    );
    if (this.#imageSlideCurrentTime >= this.#imageSlideDuration) {
      this.#nextSlide();
    }
  }
  #setSlideImageProgressInterval() {
    this.#imageSlideCurrentTime = 0;
    this.#imageSlideProgressInterval = setInterval(
      this.#onImageSlideProgressInterval.bind(this),
      this.#imageSlideProgressIntervalTick
    );
  }

  //
  #nextSlide() {
    if (this.#isSlidePaused) return;

    this.#currentSlideIndex = this.#getNextSlideIndex();
    this.#setSlide(this.#currentSlideIndex);
  }
  //
  #getVideoElement(mediaURL) {
    const video = document.createElement('video');
    video.setAttribute('src', mediaURL);

    // video.setAttribute('muted', true);

    // 브라우저 정책상 음소거가 되어있어야 자동재생이 됨.
    // video.setAttribute('autoplay', true);

    // loop가 true면 ended 이벤트가 발생안함
    // video.setAttribute('loop', true);

    return video;
  }
  #getImageElement(mediaURL) {
    const image = document.createElement('img');
    image.setAttribute('src', mediaURL);
    return image;
  }
}

export default MediaSlider;

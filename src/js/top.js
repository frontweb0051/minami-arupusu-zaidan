const swiper = new Swiper('.swiper', {
  loop: true,
  autoplay: {
    delay: 10000,
  },
  speed: 1200,
  sliderPerView: 1,
  navigation: {
    nextEl: '.control-button-next',
    prevEl: '.control-button-prev',
  },
});

const pause_btn = document.getElementById('js-swiper-pause');
let isPlaying = true;

if (pause_btn) {
  pause_btn.addEventListener('click', () => {
    if (isPlaying) {
      swiper.autoplay.stop();
      pause_btn.classList.add('paused');
      isPlaying = false;
    }else {
      swiper.autoplay.start();
      pause_btn.classList.remove('paused');
      isPlaying = true;
    }
  })
}

const news_more_button = document.getElementById('js-news-more');

if (news_more_button) {
  news_more_button.addEventListener('click', () => {
    const news_list = document.querySelector('.p-top-news__list');
    news_list.classList.remove('hidden');    
    news_more_button.classList.add('hidden');
  })
}
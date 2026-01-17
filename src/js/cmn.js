/////////////　関数 /////////////
let $body = $('body');
let scrollTop;

//スクロールを固定
function bodyFixedOn() {
  scrollTop = $(window).scrollTop();

  $body.css({
    position: 'fixed',
    top: -scrollTop,
    'overflow-y': 'hidden'
  });
}

//スクロールの固定を解除
function bodyFixedOff() {
  $body.css({
    position: '',
    top: '',
    'overflow-y': ''
  });
    
  $(window).scrollTop(scrollTop);
}

/* ==========================================================================
  humberger
========================================================================== */

// const humberger_icon = document.getElementById('js-icon');
// const humberger_menu = document.getElementById('js-menu');

// humberger_icon.addEventListener('click',function(){
//   this.classList.toggle('open');

//   if(humberger_icon.classList.contains('open')){
//     bodyFixedOn();
//     humberger_menu.classList.add('active');
//   }else{
//     bodyFixedOff();
//     humberger_menu.classList.remove('active');
//   }
// });


/* ==========================================================================
  smooth scroll
========================================================================== */
let height_h = '';
if(!document.URL.match(/lineup/)){
  height_h = $('.l-header').height();
}else{
  height_h = ''
}
$('a[href^="#"]').click(function() {
  var speed = 500;
  var href= $(this).attr('href');
  var target = $(href == '#' || href == '' ? 'html' : href);
  var position = target.offset().top - height_h;
  $('body,html').animate({scrollTop:position}, speed, 'swing');
  return false;
});

const html = document.querySelector('html');
const font_small = document.querySelector('.is-small');
const font_medium = document.querySelector('.is-medium');
const font_large = document.querySelector('.is-large');

function fontDelete() {
  sessionStorage.clear()
  html.classList.remove(...html.classList);
};

font_small.addEventListener('click', () => {
  fontDelete();
  sessionStorage.setItem('font-size','small');
  html.classList.add('is-small')
});
font_medium.addEventListener('click', () => {
  fontDelete();
  sessionStorage.setItem('font-size','medium');
  html.classList.add('is-medium')
});
font_large.addEventListener('click', () => {
  fontDelete();
  sessionStorage.setItem('font-size','large');
  html.classList.add('is-large')
});


document.addEventListener("DOMContentLoaded", () => {
  let session_value = sessionStorage.getItem('font-size');
  
  console.log(session_value);

  if(session_value === "small") {
    html.classList.add('is-small')
    console.log('今のfont-sizeは' + session_value);
  }else if(session_value === "medium") {
    html.classList.add('is-medium')
    console.log('今のfont-sizeは' + session_value);
  }else if(session_value === "large") {
    html.classList.add('is-large')
    console.log('今のfont-sizeは' + session_value);
  }
});


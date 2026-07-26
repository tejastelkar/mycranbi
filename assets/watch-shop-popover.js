(function () {
  var previousScrollY = 0;

  function pauseVideo(video) {
    if (video && typeof video.pause === 'function') {
      video.pause();
    }
  }

  function playVideo(video, muted) {
    if (!video) return;
    video.muted = muted;
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('[data-popover-root]');
    if (!root) return;

    var teaser = root.querySelector('[data-popover-open]');
    var dismiss = root.querySelector('[data-popover-dismiss]');
    var modal = root.querySelector('[data-popover-modal]');
    var closeButtons = root.querySelectorAll('[data-popover-close]');
    var teaserVideo = root.querySelector('.watch-shop-popover__teaser-video');
    var modalVideo = root.querySelector('[data-popover-video]');

    function lockPageScroll() {
      previousScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + previousScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }

    function unlockPageScroll() {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, previousScrollY);
    }

    function openModal() {
      if (!modal) return;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      lockPageScroll();
      pauseVideo(teaserVideo);
      playVideo(modalVideo, false);
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      unlockPageScroll();
      pauseVideo(modalVideo);
      playVideo(teaserVideo, true);
    }

    if (teaser) {
      teaser.addEventListener('click', function (event) {
        event.preventDefault();
        openModal();
      });
    }

    if (dismiss) {
      dismiss.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        root.style.display = 'none';
        closeModal();
      });
    }

    closeButtons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        closeModal();
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modal && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    playVideo(teaserVideo, true);
  });
})();

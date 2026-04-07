/**
 * DB OOH Campaign Banner v3 — Static anchor + rotating phrases
 * Requires: gsap + SplitText (loaded globally by the Webflow site)
 *
 * Layout:
 *  - Top: rotating white phrases (SplitText word-by-word animation)
 *  - Bottom: static "AT HOME IN THE NORTH." in orange (never animates out, has breathing glow)
 *
 * Animation per phrase:
 *  - ENTER: Words stagger in from below with 3D rotation + back easing
 *  - EXIT:  Words scatter out upward in reverse stagger
 *  - ACCENTS: Background color flash, gradient accent line sweep, ambient glow blobs
 */
(function () {
  var INTERVAL = 5000;
  var MAX_RETRIES = 50;
  var ACCENT_COLORS = ['#00CBFF', '#FF00B2', '#FF0000', '#FFBA00'];

  function initBanner() {
    if (typeof gsap === 'undefined' || typeof SplitText === 'undefined') {
      if (!initBanner._retries) initBanner._retries = 0;
      if (initBanner._retries++ < MAX_RETRIES) {
        setTimeout(initBanner, 100);
        return;
      }
      var el = document.getElementById('db-ooh-banner');
      if (el) el.classList.add('db-ooh-no-gsap');
      return;
    }

    var banner = document.getElementById('db-ooh-banner');
    if (!banner) return;

    var phrases = banner.querySelectorAll('.db-ooh-phrase');
    var staticLine = banner.querySelector('.db-ooh-static');
    var accentLine = banner.querySelector('.db-ooh-accent-line');
    var glows = banner.querySelectorAll('.db-ooh-glow');
    var total = phrases.length;
    var current = 0;
    var autoplayTimer = null;
    var isAnimating = false;
    var activeSplit = null;

    // Initialize: hide all, show first
    gsap.set(phrases, { opacity: 0, visibility: 'hidden', position: 'absolute' });
    gsap.set(phrases[0], { opacity: 1, visibility: 'visible', position: 'relative' });

    // Static line: breathing glow
    gsap.to(staticLine, {
      textShadow: '0 0 25px rgba(254,112,0,0.4), 0 0 50px rgba(254,112,0,0.2)',
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // Ambient glow blobs
    glows.forEach(function (glow, i) {
      gsap.to(glow, {
        opacity: 0.12 + (i * 0.03),
        x: (i % 2 === 0 ? 40 : -40),
        y: (i % 2 === 0 ? -30 : 30),
        scale: 1.2,
        duration: 4 + i,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.8
      });
    });

    function revertSplit() {
      if (activeSplit) {
        activeSplit.revert();
        activeSplit = null;
      }
    }

    function animateIn(phrase, onComplete) {
      activeSplit = new SplitText(phrase, { type: 'words' });
      var words = activeSplit.words;

      gsap.set(words, { opacity: 0, y: 50, rotateX: -40, scale: 0.9, transformOrigin: '50% 100%' });

      gsap.to(words, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        stagger: 0.06,
        duration: 0.5,
        ease: 'back.out(1.4)',
        onComplete: onComplete
      });
    }

    function animateOut(phrase, onComplete) {
      var split = new SplitText(phrase, { type: 'words' });
      var words = split.words;

      gsap.to(words, {
        opacity: 0,
        y: -40,
        rotateX: 30,
        scale: 0.85,
        stagger: { each: 0.03, from: 'end' },
        duration: 0.35,
        ease: 'power3.in',
        onComplete: function () {
          split.revert();
          gsap.set(phrase, { opacity: 0, visibility: 'hidden', position: 'absolute' });
          if (onComplete) onComplete();
        }
      });
    }

    function fireAccentLine() {
      var color = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
      gsap.set(accentLine, { width: '0%', left: '0%', background: 'linear-gradient(90deg, ' + color + ', #FE7000)', opacity: 1 });
      gsap.timeline()
        .to(accentLine, { width: '100%', duration: 0.3, ease: 'power2.out' })
        .to(accentLine, { left: '100%', width: '0%', duration: 0.25, ease: 'power2.in' });
    }

    function pulseBackground() {
      var color = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
      gsap.timeline()
        .to(banner, { backgroundColor: color, duration: 0.08, ease: 'none' })
        .to(banner, { backgroundColor: '#17179A', duration: 0.4, ease: 'power2.out' });
    }

    function goTo(next) {
      if (next === current || isAnimating) return;
      isAnimating = true;

      var outgoing = phrases[current];
      var incoming = phrases[next];

      fireAccentLine();
      pulseBackground();

      revertSplit();
      animateOut(outgoing, function () {
        gsap.set(incoming, { opacity: 1, visibility: 'visible', position: 'relative' });
        animateIn(incoming, function () {
          isAnimating = false;
        });
      });

      current = next;
    }

    function advance() {
      goTo((current + 1) % total);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(advance, INTERVAL);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    banner.addEventListener('mouseenter', stopAutoplay);
    banner.addEventListener('mouseleave', startAutoplay);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    // Kick off
    gsap.set(phrases[0], { opacity: 1, visibility: 'visible', position: 'relative' });
    animateIn(phrases[0], function () {
      startAutoplay();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBanner);
  } else {
    initBanner();
  }
})();

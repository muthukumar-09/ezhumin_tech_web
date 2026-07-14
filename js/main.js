/**
 * EZHUMIN TECHNOLOGIES - Core Application Logic
 * 
 * In Embedded C terms:
 * This file is our main controller loop and interrupt service handler.
 * Instead of physical pins firing ISRs, the browser's hardware events 
 * (scrolling, clicking) fire event listeners that execute this JS code.
 */

// Wait for the DOM (Document Object Model) tree to be fully parsed in RAM
document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================================
    // 1. DUAL SCROLL CONTROLLERS - UNIFIED & THROTTLED (rAF / Passive Listener)
    // =========================================================================
    const header = document.getElementById('site-header');
    const heroBg = document.querySelector('.hero-bg-container');
    
    let scrollY = 0;
    let ticking = false;

    // Single unified scroll logic handler
    const updateScrollEffects = () => {
        // 1A. Sticky Header Toggle
        if (header) {
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // 1B. Hero Parallax shifting (Limit execution to visible hero viewport)
        if (heroBg && scrollY < window.innerHeight) {
            heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
        }

        ticking = false;
    };

    // ISR Trigger: Fires on scroll. requestAnimationFrame synchronizes changes with monitor VSync refresh cycles
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        
        if (!ticking) {
            window.requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }, { passive: true }); // passive: true bypasses CPU main-thread blocking, scrolling renders instantly
    
    // =========================================================================
    // 2. HERO MOUSE PARALLAX (Subtle depth motion effect)
    // =========================================================================
    const heroSection = document.getElementById('hero');
    const heroMedia = document.querySelector('.hero-media-placeholder');
    if (heroSection && heroMedia) {
        // Only run on hover-enabled (desktop) devices to avoid touch drag conflict
        const isHoverSupported = window.matchMedia('(hover: hover)').matches;
        if (isHoverSupported) {
            heroSection.addEventListener('mousemove', (e) => {
                const { width, height } = heroSection.getBoundingClientRect();
                const moveX = (e.clientX / width - 0.5) * 15; // Shift max 7.5px left/right
                const moveY = (e.clientY / height - 0.5) * 15; // Shift max 7.5px up/down
                heroMedia.style.transform = `scale(1.05) translate(${moveX}px, ${moveY}px)`;
            });
            
            heroSection.addEventListener('mouseleave', () => {
                heroMedia.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
                heroMedia.style.transform = 'scale(1.05) translate(0px, 0px)';
            });
            
            heroSection.addEventListener('mouseenter', () => {
                heroMedia.style.transition = 'none';
            });
        }
    }

    // =========================================================================
    // 3. REVEAL ON SCROLL INTERRUPTS (IntersectionObserver API)
    // =========================================================================
    // Setup a Hardware-like Comparator Interrupt. Instead of polling scroll positions
    // at 60Hz, the browser engine monitors element intersections in native code,
    // firing our callback only when the elements cross the display threshold boundaries.
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add class to trigger CSS transition matrix
                entry.target.classList.add('active');
                // Unregister the target (like disabling a single-shot timer interrupt once fired)
                observer.unobserve(entry.target);
            }
        });
    };

    // Instantiate native browser observer
    const revealObserver = new IntersectionObserver(revealCallback, {
        root: null,          // Use the screen viewport as coordinate base
        threshold: 0.1,      // Fire interrupt when 10% of target becomes visible
        rootMargin: '0px 0px -60px 0px' // Margins around viewport boundary
    });

    // Query all core modular elements we want to reveal smoothly
    const targetsToAnimate = document.querySelectorAll(
        '.about-text p, ' +
        '.section-container h2, ' +
        '.services-grid > article, ' +
        '.tech-category, ' +
        '.benefit-item, ' +
        '.value-item, ' +
        '.product-showcase-card, ' +
        '.card-image-wrapper, ' +
        '.card-stat, ' +
        '.flowchart-step, ' +
        '.timeline-item'
    );

    // Initialize their default off-screen variables and register them to the listener
    targetsToAnimate.forEach(target => {
        target.classList.add('reveal'); // Write CSS trigger class
        revealObserver.observe(target);  // Register interrupt vector
    });

    // =========================================================================
    // 4. MOBILE MENU DRAWER CONTROLLER
    // =========================================================================
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const primaryNav = document.getElementById('primary-navigation');

    if (mobileToggle && primaryNav) {
        mobileToggle.addEventListener('click', () => {
            const isMenuExpanded = primaryNav.classList.toggle('is-active');
            mobileToggle.classList.toggle('is-active');
            mobileToggle.setAttribute('aria-expanded', isMenuExpanded);
        });

        // Close menu drawer automatically on anchor navigation triggers
        const navLinks = primaryNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                primaryNav.classList.remove('is-active');
                mobileToggle.classList.remove('is-active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // =========================================================================
    // 5. PREMIUM HORIZONTAL PRODUCT SLIDER CONTROLLER (VANILLA JS)
    // =========================================================================
    const sliderTrack = document.getElementById('slider-track');
    const sliderViewport = document.getElementById('slider-viewport');
    const slides = document.querySelectorAll('.slider-slide');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    const dots = document.querySelectorAll('.dot-indicator');

    if (sliderTrack && sliderViewport && slides.length > 0) {
        let currentSlideIndex = 0;
        let isDragging = false;
        let startX = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;
        let slideWidth = 0;

        // Calculate dimensions
        function updateSlideWidth() {
            slideWidth = sliderViewport.clientWidth;
            // Force reset track translation on resize
            goToSlide(currentSlideIndex, false);
        }

        // Snap to target slide
        function goToSlide(index, animate = true) {
            // Bound safety checks
            if (index < 0) index = 0;
            if (index >= slides.length) index = slides.length - 1;
            
            currentSlideIndex = index;
            currentTranslate = -currentSlideIndex * slideWidth;
            prevTranslate = currentTranslate;

            // Apply style with or without transitions
            if (animate) {
                sliderTrack.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
            } else {
                sliderTrack.style.transition = 'none';
            }
            sliderTrack.style.transform = `translateX(${currentTranslate}px)`;

            // Update interactive buttons state
            if (prevBtn) prevBtn.disabled = (currentSlideIndex === 0);
            if (nextBtn) nextBtn.disabled = (currentSlideIndex === slides.length - 1);

            // Sync dots indicator active layout
            dots.forEach((dot, idx) => {
                if (idx === currentSlideIndex) {
                    dot.classList.add('active');
                    dot.setAttribute('aria-selected', 'true');
                } else {
                    dot.classList.remove('active');
                    dot.setAttribute('aria-selected', 'false');
                }
            });
        }

        // Click controllers
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentSlideIndex < slides.length - 1) goToSlide(currentSlideIndex + 1);
            });
        }

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => goToSlide(idx));
        });

        // Unified pointer events for desktop drag + mobile swipe
        sliderTrack.addEventListener('pointerdown', (e) => {
            // Ignore if clicked on buttons or links
            if (e.target.closest('a') || e.target.closest('button')) return;

            isDragging = true;
            startX = e.clientX;
            sliderTrack.style.transition = 'none'; // Instant response
            sliderTrack.classList.add('dragging');
            sliderTrack.setPointerCapture(e.pointerId);
        });

        sliderTrack.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const currentX = e.clientX;
            const diffX = currentX - startX;
            const translate = prevTranslate + diffX;
            
            // Limit over-scrolling resistance
            if (currentSlideIndex === 0 && diffX > 0) {
                // Dragging right at start boundary
                sliderTrack.style.transform = `translateX(${prevTranslate + diffX * 0.3}px)`;
            } else if (currentSlideIndex === slides.length - 1 && diffX < 0) {
                // Dragging left at end boundary
                sliderTrack.style.transform = `translateX(${prevTranslate + diffX * 0.3}px)`;
            } else {
                sliderTrack.style.transform = `translateX(${translate}px)`;
            }
        });

        function handlePointerUpOrCancel(e) {
            if (!isDragging) return;
            isDragging = false;
            sliderTrack.classList.remove('dragging');
            sliderTrack.releasePointerCapture(e.pointerId);

            const diffX = e.clientX - startX;
            const threshold = 80; // pixels to trigger slide transition

            if (Math.abs(diffX) > threshold) {
                if (diffX < 0 && currentSlideIndex < slides.length - 1) {
                    goToSlide(currentSlideIndex + 1);
                } else if (diffX > 0 && currentSlideIndex > 0) {
                    goToSlide(currentSlideIndex - 1);
                } else {
                    goToSlide(currentSlideIndex); // rebound
                }
            } else {
                goToSlide(currentSlideIndex); // rebound
            }
        }

        sliderTrack.addEventListener('pointerup', handlePointerUpOrCancel);
        sliderTrack.addEventListener('pointercancel', handlePointerUpOrCancel);

        // Prevent native HTML image dragging interfering with custom script
        sliderTrack.addEventListener('dragstart', (e) => e.preventDefault());

        // Initialize dimensions and bind resize event
        updateSlideWidth();
        window.addEventListener('resize', updateSlideWidth);
        
        // Re-calibrates layout width when document has fully rendered
        window.addEventListener('load', updateSlideWidth);
    }

    // =========================================================================
    // 6. INTERACTIVE CATALOGUE MODAL CONTROLLER
    // =========================================================================
    const exploreButtons = document.querySelectorAll('.explore-catalogue-btn');
    const catalogueModal = document.getElementById('catalogue-modal');
    const modalClose = catalogueModal ? catalogueModal.querySelector('.modal-close') : null;
    const modalOverlay = catalogueModal ? catalogueModal.querySelector('.modal-overlay') : null;
    const pdfViewer = catalogueModal ? catalogueModal.querySelector('.pdf-viewer') : null;

    if (exploreButtons.length > 0 && catalogueModal && pdfViewer) {
        exploreButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Load the PDF path dynamically on first click to save resources
                if (!pdfViewer.src || pdfViewer.src === '') {
                    pdfViewer.src = 'assets/docs/minova_product_portfolio.pdf';
                }
                catalogueModal.classList.add('is-active');
                catalogueModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden'; // Lock background scrolling
            });
        });

        const closeModal = () => {
            catalogueModal.classList.remove('is-active');
            catalogueModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = ''; // Unlock background scrolling
        };

        if (modalClose) modalClose.addEventListener('click', closeModal);
        if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
        
        // Close on Escape key press
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && catalogueModal.classList.contains('is-active')) {
                closeModal();
            }
        });
    }
});
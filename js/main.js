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
        '.products-grid > article, ' +
        '.tech-category, ' +
        '.benefit-item, ' +
        '.mission-statement, ' +
        '.vision-statement, ' +
        '.value-item, ' +
        '.specs-table tr, ' +
        '.platform-card, ' +
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
    // 5. PRODUCT SPECS CATEGORY TABS CONTROLLER
    // =========================================================================
    const tabButtons = document.querySelectorAll('.product-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.tab-content .tab-pane');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            // Deactivate all tab buttons & panes
            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
            });

            // Activate current tab button & target pane
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
});
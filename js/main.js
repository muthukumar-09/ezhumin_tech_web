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
    // 6. INTERACTIVE CATALOGUE SPA VIEW CONTROLLER
    // =========================================================================
    const exploreButtons = document.querySelectorAll('.explore-catalogue-btn');
    const cataloguePage = document.getElementById('catalogue-page');
    const btnBackToHome = document.getElementById('btn-back-to-home');
    const catalogueScroller = document.getElementById('catalogue-scroller');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sheets = document.querySelectorAll('.catalogue-sheet');

    let homeScrollPosition = 0;

    if (exploreButtons.length > 0 && cataloguePage) {
        exploreButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Cache home scroll position
                homeScrollPosition = window.scrollY;
                
                // Active catalogue view state
                document.body.classList.add('catalogue-active');
                
                // Reset scroll coordinates inside catalogue viewport
                if (catalogueScroller) {
                    catalogueScroller.scrollTop = 0;
                }
                
                // Scroll main window to top
                window.scrollTo(0, 0);
            });
        });

        if (btnBackToHome) {
            btnBackToHome.addEventListener('click', () => {
                // Remove catalogue active view state
                document.body.classList.remove('catalogue-active');
                
                // Restore original homepage scroll position
                window.scrollTo({
                    top: homeScrollPosition,
                    behavior: 'instant'
                });
            });
        }

        // Sidebar Navigation & Smooth Scrollspy (Desktop View Only)
        if (catalogueScroller && sidebarLinks.length > 0 && sheets.length > 0) {
            // Click to navigate
            sidebarLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href');
                    const targetSheet = document.querySelector(targetId);
                    if (targetSheet) {
                        catalogueScroller.scrollTo({
                            top: targetSheet.offsetTop - 30, // Offset a tiny bit for border breathing room
                            behavior: 'smooth'
                        });
                    }
                });
            });

            // Scroll listener for auto link highlighting (Scrollspy)
            catalogueScroller.addEventListener('scroll', () => {
                let activeSheetId = '';
                
                sheets.forEach(sheet => {
                    const sheetTop = sheet.offsetTop - catalogueScroller.offsetTop;
                    // Detect which sheet is currently in view
                    if (catalogueScroller.scrollTop >= sheetTop - 120) {
                        activeSheetId = sheet.getAttribute('id');
                    }
                });

                if (activeSheetId) {
                    sidebarLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${activeSheetId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            }, { passive: true });
        }
    }

    // =========================================================================
    // 7. SECURE ADMIN PORTAL & FILE STORAGE SYSTEM (Firebase + Sim Mode)
    // =========================================================================
    
    // --- Firebase Web Configuration ---
    // NOTE: Replace these values with your actual Firebase Web App credentials.
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY_HERE",
        authDomain: "YOUR_PROJECT_ID_HERE.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID_HERE",
        storageBucket: "YOUR_PROJECT_ID_HERE.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID_HERE",
        appId: "YOUR_APP_ID_HERE"
    };

    // Auto-detect if Firebase has been configured
    const isFirebaseConfigured = 
        firebaseConfig.apiKey && 
        !firebaseConfig.apiKey.startsWith("YOUR_") && 
        firebaseConfig.projectId && 
        !firebaseConfig.projectId.startsWith("YOUR_");

    let auth = null;
    let storage = null;
    let isSimulationMode = !isFirebaseConfigured;

    if (isFirebaseConfigured) {
        try {
            // Initialize Firebase App
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            storage = firebase.storage();
            console.log("Firebase storage and auth initialized successfully.");
        } catch (err) {
            console.error("Firebase init failed, switching to Simulation Mode:", err);
            isSimulationMode = true;
        }
    } else {
        console.warn("Firebase not configured. Running Admin Portal in Simulation Mode.");
    }

    // --- DOM Elements Reference ---
    const adminPortalLinks = document.querySelectorAll('.admin-portal-link');
    const adminPage = document.getElementById('admin-page');
    const btnAdminBackToHome = document.getElementById('btn-admin-back-to-home');
    const loginView = document.getElementById('admin-login-view');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const loginForm = document.getElementById('admin-login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginErrorAlert = document.getElementById('login-error-alert');
    const userEmailBadge = document.getElementById('admin-user-email');
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    
    const folderList = document.getElementById('folder-list');
    const folderButtons = document.querySelectorAll('.folder-link');
    const currentFolderTitle = document.getElementById('current-folder-title');
    const fileTableBody = document.getElementById('file-table-body');
    const dashboardAlert = document.getElementById('dashboard-alert');
    
    const uploadDropzone = document.getElementById('upload-dropzone');
    const fileUploader = document.getElementById('file-uploader');
    const progressContainer = document.getElementById('progress-container');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    
    let activeFolder = "Company Policies";
    let activeUser = null;
    let adminHomeScrollPosition = 0;

    // --- View Navigation Controllers ---
    const showAdminPortal = () => {
        adminHomeScrollPosition = window.scrollY;
        document.body.classList.add('admin-active');
        window.scrollTo(0, 0);
        
        // Auto-check authentication state
        checkAuthState();
    };

    const hideAdminPortal = () => {
        document.body.classList.remove('admin-active');
        window.scrollTo({
            top: adminHomeScrollPosition,
            behavior: 'instant'
        });
        // Clear login alerts
        if (loginErrorAlert) {
            loginErrorAlert.style.display = 'none';
        }
    };

    // Bind link clicks
    adminPortalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showAdminPortal();
        });
    });

    if (btnAdminBackToHome) {
        btnAdminBackToHome.addEventListener('click', hideAdminPortal);
    }

    // --- Mock Storage Engine (Simulation Mode) ---
    const getMockFiles = () => {
        const localData = localStorage.getItem('mock_admin_files');
        if (localData) return JSON.parse(localData);
        
        // Default seed data for Simulation mode
        const seedData = {
            "Company Policies": [
                { name: "Ezhumin_HR_Handbook_2026.pdf", date: "2026-05-10", size: "1.2 MB", downloadUrl: "#" },
                { name: "Operational_Safety_Baseline.pdf", date: "2026-06-15", size: "2.4 MB", downloadUrl: "#" }
            ],
            "Technical Datasheets": [
                { name: "MINOVA_L_Series_Municipal_Blueprint.pdf", date: "2026-07-02", size: "4.8 MB", downloadUrl: "#" },
                { name: "MINOVA_H_Series_BESS_Wiring.pdf", date: "2026-07-12", size: "3.1 MB", downloadUrl: "#" }
            ],
            "Client Presentations": [
                { name: "GreenEnergy_Industrial_Bid_V2.pdf", date: "2026-04-18", size: "12.4 MB", downloadUrl: "#" }
            ],
            "Financial Records": [
                { name: "Q1_Financial_Forecast_Ezhumin.pdf", date: "2026-04-30", size: "980 KB", downloadUrl: "#" }
            ]
        };
        localStorage.setItem('mock_admin_files', JSON.stringify(seedData));
        return seedData;
    };

    const saveMockFiles = (data) => {
        localStorage.setItem('mock_admin_files', JSON.stringify(data));
    };

    // --- Authentication Operations ---
    const checkAuthState = () => {
        if (isSimulationMode) {
            // Read active session token
            const sessionUser = sessionStorage.getItem('mock_admin_session');
            if (sessionUser) {
                activeUser = { email: sessionUser };
                userEmailBadge.textContent = `${activeUser.email} (SIMULATED)`;
                loginView.style.display = 'none';
                dashboardView.style.display = 'flex';
                loadDocuments();
            } else {
                activeUser = null;
                loginView.style.display = 'flex';
                dashboardView.style.display = 'none';
            }
        } else {
            // Real Firebase state listener
            auth.onAuthStateChanged(user => {
                if (user) {
                    activeUser = user;
                    userEmailBadge.textContent = user.email;
                    loginView.style.display = 'none';
                    dashboardView.style.display = 'flex';
                    loadDocuments();
                } else {
                    activeUser = null;
                    loginView.style.display = 'flex';
                    dashboardView.style.display = 'none';
                }
            });
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginEmail.value.trim();
            const password = loginPassword.value;
            loginErrorAlert.style.display = 'none';

            if (isSimulationMode) {
                // Simulation login: Accept email and check password against simulated key
                if (password === "admin123") {
                    sessionStorage.setItem('mock_admin_session', email);
                    loginForm.reset();
                    checkAuthState();
                } else {
                    loginErrorAlert.textContent = "Incorrect password! In Simulation Mode, use: admin123";
                    loginErrorAlert.style.display = 'block';
                }
            } else {
                // Real Firebase sign in
                auth.signInWithEmailAndPassword(email, password)
                    .then(() => {
                        loginForm.reset();
                    })
                    .catch(err => {
                        loginErrorAlert.textContent = err.message;
                        loginErrorAlert.style.display = 'block';
                    });
            }
        });
    }

    if (btnAdminLogout) {
        btnAdminLogout.addEventListener('click', () => {
            if (isSimulationMode) {
                sessionStorage.removeItem('mock_admin_session');
                checkAuthState();
            } else {
                auth.signOut().catch(err => console.error("Sign out error:", err));
            }
        });
    }

    // --- Directory Navigation ---
    if (folderList) {
        folderButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active link state
                folderButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update folder state
                activeFolder = btn.getAttribute('data-folder');
                currentFolderTitle.textContent = activeFolder;
                
                // Reload files
                loadDocuments();
            });
        });
    }

    // --- Document List Loader ---
    const loadDocuments = () => {
        // Clear active list
        fileTableBody.innerHTML = '';
        
        if (isSimulationMode) {
            const files = getMockFiles()[activeFolder] || [];
            if (files.length === 0) {
                fileTableBody.innerHTML = '<tr><td colspan="4" class="empty-files-placeholder">No documents found in this folder.</td></tr>';
                return;
            }

            files.forEach((file, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${file.name}</strong></td>
                    <td>${file.date}</td>
                    <td>${file.size}</td>
                    <td>
                        <a href="${file.downloadUrl}" class="action-btn-link" title="Download Document">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5 5-5m-5 5V3"/>
                            </svg>
                        </a>
                        <button class="action-btn-link action-btn-delete" data-index="${index}" title="Delete Document">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </td>
                `;
                fileTableBody.appendChild(tr);
            });

            // Bind mock delete listeners
            fileTableBody.querySelectorAll('.action-btn-delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'), 10);
                    deleteMockFile(index);
                });
            });
        } else {
            // Real Firebase list operation
            const folderRef = storage.ref().child(`admin_portal/${activeFolder}`);
            fileTableBody.innerHTML = '<tr><td colspan="4" class="empty-files-placeholder">Loading documents from storage...</td></tr>';
            
            folderRef.listAll()
                .then(res => {
                    if (res.items.length === 0) {
                        fileTableBody.innerHTML = '<tr><td colspan="4" class="empty-files-placeholder">No documents found in this folder.</td></tr>';
                        return;
                    }
                    
                    fileTableBody.innerHTML = '';
                    
                    const fetchPromises = res.items.map(itemRef => {
                        // Gather metadata for sizes and dates
                        const metaPromise = itemRef.getMetadata();
                        const urlPromise = itemRef.getDownloadURL();
                        
                        return Promise.all([metaPromise, urlPromise]).then(([metadata, downloadUrl]) => {
                            // Convert bytes to readable formats
                            const sizeInBytes = metadata.size;
                            let sizeStr = `${(sizeInBytes / 1024).toFixed(1)} KB`;
                            if (sizeInBytes > 1024 * 1024) {
                                sizeStr = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
                            }
                            
                            // Format date
                            const dateStr = new Date(metadata.timeCreated).toISOString().split('T')[0];
                            
                            return {
                                name: itemRef.name,
                                date: dateStr,
                                size: sizeStr,
                                downloadUrl: downloadUrl,
                                fullPath: itemRef.fullPath
                            };
                        });
                    });
                    
                    Promise.all(fetchPromises)
                        .then(files => {
                            files.forEach(file => {
                                const tr = document.createElement('tr');
                                tr.innerHTML = `
                                    <td><strong>${file.name}</strong></td>
                                    <td>${file.date}</td>
                                    <td>${file.size}</td>
                                    <td>
                                        <a href="${file.downloadUrl}" target="_blank" rel="noopener noreferrer" class="action-btn-link" title="Download Document">
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5 5 5-5m-5 5V3"/>
                                            </svg>
                                        </a>
                                        <button class="action-btn-link action-btn-delete" data-path="${file.fullPath}" title="Delete Document">
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/>
                                            </svg>
                                        </button>
                                    </td>
                                `;
                                fileTableBody.appendChild(tr);
                            });
                            
                            // Bind delete triggers
                            fileTableBody.querySelectorAll('.action-btn-delete').forEach(btn => {
                                btn.addEventListener('click', () => {
                                    const fullPath = btn.getAttribute('data-path');
                                    deleteRealFile(fullPath);
                                });
                            });
                        })
                        .catch(err => {
                            showDashboardAlert("Failed to resolve file details: " + err.message, "danger");
                        });
                })
                .catch(err => {
                    fileTableBody.innerHTML = '<tr><td colspan="4" class="empty-files-placeholder">Error loading files.</td></tr>';
                    showDashboardAlert("Folder listing failed: " + err.message, "danger");
                });
        }
    };

    // --- Delete Operations ---
    const deleteMockFile = (index) => {
        if (confirm("Are you sure you want to delete this document from simulation?")) {
            const data = getMockFiles();
            const folderFiles = data[activeFolder];
            if (folderFiles && folderFiles[index]) {
                folderFiles.splice(index, 1);
                data[activeFolder] = folderFiles;
                saveMockFiles(data);
                loadDocuments();
                showDashboardAlert("Document deleted successfully (Simulated).", "success");
            }
        }
    };

    const deleteRealFile = (fullPath) => {
        if (confirm("Are you sure you want to delete this document from cloud storage?")) {
            storage.ref(fullPath).delete()
                .then(() => {
                    loadDocuments();
                    showDashboardAlert("Document deleted successfully from cloud storage.", "success");
                })
                .catch(err => {
                    showDashboardAlert("Delete failed: " + err.message, "danger");
                });
        }
    };

    // --- Upload Handlers ---
    const triggerUpload = (file) => {
        if (!file) return;
        if (file.type !== "application/pdf") {
            showDashboardAlert("Error: Only PDF documents are allowed.", "danger");
            return;
        }

        // Show progress box
        progressContainer.style.display = 'block';
        progressBarFill.style.width = '0%';
        progressText.textContent = 'Uploading: 0%';

        if (isSimulationMode) {
            // Simulated upload sequence
            let percentage = 0;
            const interval = setInterval(() => {
                percentage += 10;
                progressBarFill.style.width = `${percentage}%`;
                progressText.textContent = `Uploading: ${percentage}%`;
                
                if (percentage >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        // Complete simulated upload
                        progressContainer.style.display = 'none';
                        
                        const data = getMockFiles();
                        if (!data[activeFolder]) data[activeFolder] = [];
                        
                        // Parse size
                        let sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
                        if (file.size > 1024 * 1024) {
                            sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                        }
                        
                        // Append details
                        data[activeFolder].push({
                            name: file.name,
                            date: new Date().toISOString().split('T')[0],
                            size: sizeStr,
                            downloadUrl: "#"
                        });
                        
                        saveMockFiles(data);
                        loadDocuments();
                        showDashboardAlert("Document uploaded successfully (Simulated).", "success");
                    }, 300);
                }
            }, 100);
        } else {
            // Real Firebase Storage upload
            const fileRef = storage.ref().child(`admin_portal/${activeFolder}/${file.name}`);
            const task = fileRef.put(file);
            
            task.on('state_changed', 
                (snapshot) => {
                    // Update progress meter
                    const percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    progressBarFill.style.width = `${percentage}%`;
                    progressText.textContent = `Uploading: ${percentage}%`;
                }, 
                (err) => {
                    progressContainer.style.display = 'none';
                    showDashboardAlert("Upload failed: " + err.message, "danger");
                }, 
                () => {
                    // Finish upload successfully
                    progressContainer.style.display = 'none';
                    loadDocuments();
                    showDashboardAlert("Document uploaded successfully to cloud storage.", "success");
                }
            );
        }
    };

    // --- Alert Feedback Messages ---
    const showDashboardAlert = (msg, type) => {
        dashboardAlert.textContent = msg;
        dashboardAlert.className = `alert alert-${type === 'success' ? 'success' : 'danger'}`;
        dashboardAlert.style.display = 'block';
        
        // Auto fade out after 4 seconds
        setTimeout(() => {
            dashboardAlert.style.display = 'none';
        }, 4000);
    };

    // --- Drag-and-Drop Dropzone Events ---
    if (uploadDropzone) {
        // Trigger file input dialog
        uploadDropzone.addEventListener('click', (e) => {
            if (e.target.closest('.upload-progress-container')) return; // Avoid dialog click bubbling on progress
            fileUploader.click();
        });

        fileUploader.addEventListener('change', () => {
            if (fileUploader.files.length > 0) {
                triggerUpload(fileUploader.files[0]);
            }
        });

        // Dragover events
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                uploadDropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                uploadDropzone.classList.remove('dragover');
            }, false);
        });

        // Drop file
        uploadDropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                triggerUpload(files[0]);
            }
        });
    }
});
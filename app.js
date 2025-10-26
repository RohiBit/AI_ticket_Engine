// Application state management
let currentPage = 'dashboard';
let currentTicketInput = 'type';
let uploadedFile = null;

// DOM elements
const navItems = document.querySelectorAll('.nav-item');
const pageContents = document.querySelectorAll('.page-content');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const inputSections = document.querySelectorAll('.input-section');
const ticketTextarea = document.getElementById('ticketTextarea');
const charCount = document.getElementById('charCount');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const submitTicket = document.getElementById('submitTicket');
const processingOverlay = document.getElementById('processingOverlay');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupFileUpload();
});

function initializeApp() {
    // Set initial page
    showPage('dashboard');
    
    // Set initial ticket input method
    setTicketInputMethod('type');
    
    // Set initial tab
    setActiveTab('add-ticket');
}

function setupEventListeners() {
    // Navigation items
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Tab buttons
    tabBtns.forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });
    
    // Input toggle buttons
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', handleInputToggle);
    });
    
    // Ticket textarea character count
    if (ticketTextarea) {
        ticketTextarea.addEventListener('input', updateCharacterCount);
    }
    
    // Browse button
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Submit ticket button
    if (submitTicket) {
        submitTicket.addEventListener('click', handleTicketSubmit);
    }
    
    // Quick action buttons
    const quickActionBtns = document.querySelectorAll('[data-action]');
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function setupFileUpload() {
    if (!fileUploadArea) return;
    
    // Drag and drop events
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragenter', handleDragEnter);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleFileDrop);
    
    // Click to browse
    fileUploadArea.addEventListener('click', () => {
        if (!fileUploadArea.classList.contains('has-file')) {
            fileInput.click();
        }
    });
}

function handleNavigation(event) {
    const targetPage = event.currentTarget.dataset.page;
    
    if (targetPage && targetPage !== currentPage) {
        // Remove active state from all nav items
        navItems.forEach(item => item.classList.remove('active'));
        
        // Add active state to clicked item
        event.currentTarget.classList.add('active');
        
        // Show the target page
        showPage(targetPage);
        
        // Update current page
        currentPage = targetPage;
    }
}

function showPage(pageId) {
    // Hide all page contents
    pageContents.forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        
        // Add page transition animation
        targetPage.style.opacity = '0';
        targetPage.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            targetPage.style.transition = 'all 0.3s ease';
            targetPage.style.opacity = '1';
            targetPage.style.transform = 'translateY(0)';
        }, 50);
    }
}

function handleTabSwitch(event) {
    const targetTab = event.currentTarget.dataset.tab;
    
    if (targetTab) {
        setActiveTab(targetTab);
    }
}

function setActiveTab(tabId) {
    // Remove active state from all tab buttons
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    // Add active state to target tab button
    const targetTabBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetTabBtn) {
        targetTabBtn.classList.add('active');
    }
    
    // Hide all tab contents
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show target tab content
    const targetTabContent = document.getElementById(`${tabId}-tab`);
    if (targetTabContent) {
        targetTabContent.classList.remove('hidden');
    }
}

function handleInputToggle(event) {
    const inputMethod = event.currentTarget.dataset.input;
    
    if (inputMethod && inputMethod !== currentTicketInput) {
        setTicketInputMethod(inputMethod);
    }
}

function setTicketInputMethod(method) {
    // Remove active state from all toggle buttons
    toggleBtns.forEach(btn => btn.classList.remove('active'));
    
    // Add active state to target toggle button
    const targetToggle = document.querySelector(`[data-input="${method}"]`);
    if (targetToggle) {
        targetToggle.classList.add('active');
    }
    
    // Hide all input sections
    inputSections.forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show target input section
    const targetSection = document.getElementById(`${method}-input`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    currentTicketInput = method;
    
    // Clear any previous data
    if (method === 'type' && ticketTextarea) {
        ticketTextarea.value = '';
        updateCharacterCount();
    } else if (method === 'upload') {
        clearFileUpload();
    }
}

function updateCharacterCount() {
    if (!ticketTextarea || !charCount) return;
    
    const length = ticketTextarea.value.length;
    charCount.textContent = length;
    
    // Update submit button state
    updateSubmitButton();
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleDragEnter(event) {
    event.preventDefault();
    if (!fileUploadArea.classList.contains('has-file')) {
        fileUploadArea.classList.add('dragover');
    }
}

function handleDragLeave(event) {
    event.preventDefault();
    // Only remove dragover if we're leaving the upload area entirely
    if (!fileUploadArea.contains(event.relatedTarget)) {
        fileUploadArea.classList.remove('dragover');
    }
}

function handleFileDrop(event) {
    event.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    if (fileUploadArea.classList.contains('has-file')) {
        return;
    }
    
    const files = Array.from(event.dataTransfer.files);
    const txtFile = files.find(file => file.name.toLowerCase().endsWith('.txt'));
    
    if (txtFile) {
        handleFile(txtFile);
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (file) {
        if (file.name.toLowerCase().endsWith('.txt')) {
            handleFile(file);
        } else {
            fileInput.value = '';
        }
    }
}

function handleFile(file) {
    uploadedFile = file;
    
    // Update UI to show file info
    fileUploadArea.classList.add('has-file');
    
    const fileSize = (file.size / 1024).toFixed(2) + ' KB';
    
    fileInfo.innerHTML = `
        <i class="fas fa-file-alt"></i>
        <div>
            <strong>${file.name}</strong>
            <span>${fileSize}</span>
        </div>
        <button type="button" class="btn btn--outline btn--sm" onclick="clearFileUpload()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    fileInfo.classList.remove('hidden');
    
    // Update submit button state
    updateSubmitButton();
}

function clearFileUpload() {
    uploadedFile = null;
    fileInput.value = '';
    fileUploadArea.classList.remove('has-file', 'dragover');
    fileInfo.classList.add('hidden');
    fileInfo.innerHTML = '';
    
    // Update submit button state
    updateSubmitButton();
}

function updateSubmitButton() {
    if (!submitTicket) return;
    
    let hasContent = false;
    
    if (currentTicketInput === 'type') {
        hasContent = ticketTextarea && ticketTextarea.value.trim().length > 0;
    } else if (currentTicketInput === 'upload') {
        hasContent = uploadedFile !== null;
    }
    
    submitTicket.disabled = !hasContent;
    
    if (hasContent) {
        submitTicket.classList.remove('btn--outline');
        submitTicket.classList.add('btn--primary');
    } else {
        submitTicket.classList.remove('btn--primary');
        submitTicket.classList.add('btn--outline');
    }
}

function handleTicketSubmit() {
    if (submitTicket.disabled) return;
    
    let content = '';
    
    if (currentTicketInput === 'type') {
        content = ticketTextarea.value.trim();
        if (!content) {
            return;
        }
    } else if (currentTicketInput === 'upload') {
        if (!uploadedFile) {
            return;
        }
        
        // Read file content
        const reader = new FileReader();
        reader.onload = function(e) {
            content = e.target.result;
            processTicket(content, uploadedFile.name);
        };
        reader.readAsText(uploadedFile);
        return;
    }
    
    processTicket(content);
}

function processTicket(content, fileName = null) {
    // Show processing overlay
    showProcessingOverlay();
    
    // Simulate processing time
    setTimeout(() => {
        // Hide processing overlay
        hideProcessingOverlay();
        
        // Create ticket ID
        const ticketId = 'T' + Date.now().toString().slice(-6);
        
        // Clear form
        if (currentTicketInput === 'type') {
            ticketTextarea.value = '';
            updateCharacterCount();
        } else {
            clearFileUpload();
        }
        
        // Switch to ticket list tab to show the "submitted" state
        setActiveTab('ticket-list');
        
        // Update the empty state message
        updateTicketListEmptyState();
        
    }, 2000);
}

function updateTicketListEmptyState() {
    const ticketsEmpty = document.querySelector('.tickets-empty');
    if (ticketsEmpty) {
        ticketsEmpty.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h4>Ticket submitted successfully!</h4>
            <p>Your ticket is being processed by our AI engine</p>
        `;
        
        // Revert back to original empty state after 5 seconds
        setTimeout(() => {
            ticketsEmpty.innerHTML = `
                <i class="fas fa-ticket-alt"></i>
                <h4>No tickets have been submitted yet</h4>
                <p>Submit your first ticket to get started</p>
            `;
        }, 5000);
    }
}

function handleQuickAction(event) {
    const action = event.currentTarget.dataset.action;
    
    switch (action) {
        case 'new-ticket':
            // Navigate to tickets page and add ticket tab
            showPage('tickets');
            setActiveTab('add-ticket');
            setTicketInputMethod('type');
            
            // Update navigation
            navItems.forEach(item => item.classList.remove('active'));
            document.querySelector('[data-page="tickets"]').classList.add('active');
            currentPage = 'tickets';
            break;
            
        case 'view-analytics':
            // Navigate to analytics page
            showPage('analytics');
            
            // Update navigation
            navItems.forEach(item => item.classList.remove('active'));
            document.querySelector('[data-page="analytics"]').classList.add('active');
            currentPage = 'analytics';
            break;
    }
}

function handleKeyboardShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case '1':
                event.preventDefault();
                document.querySelector('[data-page="dashboard"]').click();
                break;
            case '2':
                event.preventDefault();
                document.querySelector('[data-page="tickets"]').click();
                break;
            case '3':
                event.preventDefault();
                document.querySelector('[data-page="analytics"]').click();
                break;
            case '4':
                event.preventDefault();
                document.querySelector('[data-page="knowledge"]').click();
                break;
            case 'n':
                if (currentPage === 'tickets') {
                    event.preventDefault();
                    setActiveTab('add-ticket');
                    setTicketInputMethod('type');
                    if (ticketTextarea) {
                        ticketTextarea.focus();
                    }
                }
                break;
        }
    }
    
    // Escape key to close overlays
    if (event.key === 'Escape') {
        hideProcessingOverlay();
    }
}

function showProcessingOverlay() {
    if (processingOverlay) {
        processingOverlay.classList.remove('hidden');
    }
}

function hideProcessingOverlay() {
    if (processingOverlay) {
        processingOverlay.classList.add('hidden');
    }
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Add some interactive particle effects on mouse move
function createInteractiveParticles() {
    const container = document.querySelector('.particles-container');
    
    document.addEventListener('mousemove', (e) => {
        if (Math.random() > 0.98) { // Less frequent than original
            const particle = document.createElement('div');
            particle.className = 'interactive-particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(50, 184, 198, 0.8);
                border-radius: 50%;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                pointer-events: none;
                animation: particleFade 1s ease-out forwards;
                z-index: 1;
            `;
            
            container.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    });
}

// Add particle fade animation
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFade {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        100% {
            opacity: 0;
            transform: scale(0) translateY(-50px);
        }
    }
`;
document.head.appendChild(style);

// Initialize interactive particles
createInteractiveParticles();

// Add page visibility change handler to pause animations when not visible
document.addEventListener('visibilitychange', function() {
    const particles = document.querySelectorAll('.particle');
    
    if (document.hidden) {
        particles.forEach(particle => {
            particle.style.animationPlayState = 'paused';
        });
    } else {
        particles.forEach(particle => {
            particle.style.animationPlayState = 'running';
        });
    }
});

// Initialize tooltips for disabled buttons
function initializeTooltips() {
    const disabledButtons = document.querySelectorAll('button[disabled]');
    
    disabledButtons.forEach(button => {
        button.title = 'Feature available after submitting tickets';
    });
}

// Call after DOM is loaded
setTimeout(initializeTooltips, 100);

// Performance optimization: Throttle resize events
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Re-initialize any layout-dependent features if needed
        console.log('Window resized, layout adjusted');
    }, 250);
});

// Add error handling for the entire app
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
});

// Prevent default drag behaviors on the document
document.addEventListener('dragover', function(e) {
    if (!e.target.closest('.file-upload-area')) {
        e.preventDefault();
    }
});

document.addEventListener('drop', function(e) {
    if (!e.target.closest('.file-upload-area')) {
        e.preventDefault();
    }
});
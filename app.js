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
    console.log('Navigation clicked:', targetPage); // Debug log
    
    if (targetPage && targetPage !== currentPage) {
        console.log('Switching from', currentPage, 'to', targetPage); // Debug log
        
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
    console.log('Switching to page:', pageId); // Debug log
    
    // Hide all page contents first
    pageContents.forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        console.log('Found target page:', targetPage.id); // Debug log
        // Remove hidden class to show the page
        targetPage.classList.remove('hidden');
    } else {
        console.error('Page not found:', pageId); // Debug log
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
    
    // Show target input section. Support multiple ID naming conventions used in HTML
    const targetSection = document.getElementById(`${method}-input`) 
        || document.getElementById(`${method}Section`) 
        || document.getElementById(`${method}-Section`)
        || document.getElementById(`${method}section`);
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
            // Check if content contains multiple tickets (separated by double newlines or --- or similar)
            const tickets = parseMultipleTickets(content);
            if (tickets.length > 1) {
                processBatchTickets(tickets);
            } else {
                processTicket(content, uploadedFile.name);
            }
        };
        reader.readAsText(uploadedFile);
        return;
    }
    
    processTicket(content);
}

function processTicket(content, fileName = null) {
    // Show processing overlay
    showProcessingOverlay();
    
    // Prepare form data
    const formData = new FormData();
    formData.append('ticket', content);
    if (fileName) {
        const file = new File([content], fileName, { type: 'text/plain' });
        formData.append('ticket_file', file);
    }
    
    // Call our API to analyze the ticket.
    // If the page is opened via file:// (origin === 'null'), fall back to localhost
    const apiBase = (window.location && window.location.protocol && window.location.protocol.startsWith('http'))
        ? window.location.origin
        : 'http://localhost:8000';
    const analyzeUrl = apiBase + '/analyze';

    fetch(analyzeUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`API error: ${response.status} ${response.statusText} - ${text}`);
            });
        }
        return response.json();
    })
    .then(result => {
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

        // Add the ticket to the list with priority info
        const ticketData = {
            id: ticketId,
            content: content,
            priority: result.priority,
            confidence: result.confidence,
            priorityScores: result.priority_scores
        };
        
        // Update the ticket list
        addTicketToList(ticketData);
        
        // Update dashboard, analytics, and knowledge graph
        if (window.AppState) {
            window.AppState.updateStats(ticketData);
        }

        // Switch to ticket list tab
        setActiveTab('ticket-list');
    })
    .catch(error => {
        console.error('Error analyzing ticket:', error);
        hideProcessingOverlay();

        // More helpful message for common causes
        const msg = error.message && error.message.includes('Failed to fetch')
            ? 'Cannot reach analysis server. Make sure the backend is running and open the app via the server (http://localhost:8000/static/index.html).' 
            : 'Error analyzing ticket. ' + error.message;

        alert(msg);
    });
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
            
            // Update navigation
            navItems.forEach(item => item.classList.remove('active'));
            document.querySelector('[data-page="tickets"]').classList.add('active');
            currentPage = 'tickets';
            break;
            
        default:
            console.log('Unknown action:', action);
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
        // Ensure default processing content is shown (in case a batch overlay replaced innerHTML)
        processingOverlay.innerHTML = `
            <div class="glass-card processing-card">
                <div class="processing-animation">
                    <div class="processing-spinner"></div>
                </div>
                <h3>Processing Ticket...</h3>
                <p>Your ticket is being processed by our AI engine</p>
            </div>
        `;
        processingOverlay.classList.remove('hidden');
    }
}

function hideProcessingOverlay() {
    if (processingOverlay) {
        processingOverlay.classList.add('hidden');
        // Reset innerHTML to default minimal state to avoid stale batch markup
        processingOverlay.innerHTML = `
            <div class="glass-card processing-card">
                <div class="processing-animation">
                    <div class="processing-spinner"></div>
                </div>
                <h3>Processing Ticket...</h3>
                <p>Your ticket is being processed by our AI engine</p>
            </div>
        `;
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

function addTicketToList(ticket) {
    const ticketsContainer = document.getElementById('ticketsContainer');
    const ticketsEmpty = document.querySelector('.tickets-empty');
    
    // Hide empty state
    if (ticketsEmpty) {
        ticketsEmpty.style.display = 'none';
    }
    
    // Create ticket element
    const ticketEl = document.createElement('div');
    ticketEl.className = `ticket-item priority-${ticket.priority}`;
    
    // Format the confidence as percentage
    const confidence = (ticket.confidence * 100).toFixed(1);
    
    // Create the priority indicator color based on level
    const priorityColor = {
        high: '#f44336',
        medium: '#ff9800',
        low: '#4caf50'
    }[ticket.priority] || '#757575';
    
    ticketEl.innerHTML = `
        <div class="ticket-header">
            <span class="ticket-id">${ticket.id}</span>
            <div class="ticket-priority" style="background-color: ${priorityColor}">
                ${ticket.priority.toUpperCase()}
                <span class="confidence">${confidence}%</span>
            </div>
        </div>
        <div class="ticket-content">
            ${formatAnalysisText(ticket.content)}
        </div>
    `;
    // Add actions area: Suggest articles
    const actions = document.createElement('div');
    actions.className = 'ticket-actions';
    actions.innerHTML = `<button class="btn btn--outline btn--sm" type="button">Suggest articles</button>`;
    const suggestBtn = actions.querySelector('button');
    suggestBtn.addEventListener('click', () => {
        // show loading state
        suggestBtn.disabled = true;
        suggestBtn.textContent = 'Loading...';
        fetchRecommendations(ticketEl, ticket.content, 5).finally(() => {
            suggestBtn.disabled = false;
            suggestBtn.textContent = 'Suggest articles';
        });
    });
    ticketEl.appendChild(actions);
    
    // Add to container
    ticketsContainer.insertBefore(ticketEl, ticketsContainer.firstChild);
}

async function fetchRecommendations(ticketEl, ticketContent, top_k = 5) {
    try {
        const formData = new FormData();
        formData.append('ticket', ticketContent);
        formData.append('top_k', String(top_k));
        // Use same origin fallback as other requests
        const apiBase = (window.location && window.location.protocol && window.location.protocol.startsWith('http'))
            ? window.location.origin
            : 'http://localhost:8000';
        const res = await fetch(apiBase + '/recommend', { method: 'POST', body: formData });
        const data = await res.json();
        const existing = ticketEl.querySelector('.recommendations');
        if (existing) existing.remove();
        const wrap = document.createElement('div');
        wrap.className = 'recommendations';
        if (!data.ok) {
            wrap.innerHTML = `<div class="rec-error">No recommendations: ${escapeHtml(data.error || 'unknown')}</div>`;
            ticketEl.appendChild(wrap);
            return;
        }
        if (!data.results || data.results.length === 0) {
            wrap.innerHTML = '<div class="rec-empty">No recommendations found</div>';
            ticketEl.appendChild(wrap);
            return;
        }
        const list = document.createElement('ul');
        list.className = 'rec-list';
        data.results.forEach(r => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${escapeHtml(r.title || 'Untitled')}</strong> <span class="rec-score">${(r.score||0).toFixed(3)}</span><div class="rec-snippet">${escapeHtml(r.snippet||'')}</div>`;
            list.appendChild(li);
        });
        wrap.appendChild(list);
        ticketEl.appendChild(wrap);
    } catch (err) {
        console.error('Recommendation error', err);
        const existing = ticketEl.querySelector('.recommendations');
        if (existing) existing.remove();
        const wrap = document.createElement('div');
        wrap.className = 'recommendations';
        wrap.innerHTML = `<div class="rec-error">Recommendation failed: ${escapeHtml(err.message || String(err))}</div>`;
        ticketEl.appendChild(wrap);
    }
}

/**
 * Safely escape HTML characters to avoid XSS when inserting formatted HTML.
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Convert a long single-paragraph analysis into readable HTML.
 * Heuristics implemented:
 * - Convert lines that look like `Title:`, `Steps to reproduce:` etc into bold headings.
 * - Convert numbered lists (1. 2. ...) into <ol> and hyphen/ bullet lines into <ul>.
 * - Preserve paragraphs separated by blank lines.
 */
function formatAnalysisText(raw) {
    if (!raw) return '<p></p>';

    // Normalize newlines
    let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Quick escape
    text = escapeHtml(text);

    // Split into paragraphs by two or more newlines
    const paragraphs = text.split(/\n\s*\n/);
    const out = [];

    paragraphs.forEach(par => {
        const lines = par.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return;

        // If paragraph looks like a numbered list
        if (/^\d+\.\s+/.test(lines[0])) {
            out.push('<ol>');
            lines.forEach(l => {
                const item = l.replace(/^\d+\.\s+/, '');
                out.push(`<li>${item}</li>`);
            });
            out.push('</ol>');
            return;
        }

        // If paragraph looks like bullets
        if (/^[-*]\s+/.test(lines[0])) {
            out.push('<ul>');
            lines.forEach(l => {
                const item = l.replace(/^[-*]\s+/, '');
                out.push(`<li>${item}</li>`);
            });
            out.push('</ul>');
            return;
        }

        // If first line contains a heading-like pattern 'Heading: rest'
        const headingMatch = lines[0].match(/^([A-Za-z][A-Za-z0-9 \-]{1,60}):\s*(.*)$/);
        if (headingMatch) {
            const h = escapeHtml(headingMatch[1]);
            const rest = headingMatch[2];
            out.push(`<p><strong>${h}:</strong> ${rest}</p>`);
            // Remaining lines become a paragraph or list
            if (lines.length > 1) {
                const restLines = lines.slice(1).join(' ');
                out.push(`<p>${restLines}</p>`);
            }
            return;
        }

        // Otherwise render as single paragraph (join lines with spaces)
        out.push(`<p>${lines.join(' ')}</p>`);
    });

    return out.join('\n');
}

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
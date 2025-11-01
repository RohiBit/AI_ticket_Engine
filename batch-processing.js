// Functions for handling multiple tickets

function parseMultipleTickets(content) {
    // First try splitting by markdown-style separators (---) with proper handling
    let tickets = content.split(/\n\s*---+\s*\n/);
    
    // If we only got one ticket, try splitting by double newlines
    if (tickets.length === 1) {
        tickets = content.split(/\n\s*\n(?=[A-Za-z])/);  // Look for paragraphs that start with a letter
    }
    
    // Filter out empty tickets, separator lines, and trim each ticket
    return tickets
        .map(t => t.trim())
        .filter(t => t.length > 0 && !t.match(/^-+$/))  // Remove separator-only entries
        .filter(t => t.match(/[A-Za-z]/))
}

async function processBatchTickets(tickets) {
    // Update processing overlay to show batch progress
    showBatchProcessingOverlay(tickets.length);
    
    // Process tickets sequentially to avoid overwhelming the server
    let completed = 0;
    const results = [];
    
    for (const ticket of tickets) {
        try {
            const result = await processTicketAsync(ticket);
            // If the processing returned a ticketData, add to results
            if (result) results.push(result);
        } catch (error) {
            // Log but don't stop the batch; we'll still update progress in finally
            console.error('Error processing ticket:', error);
        } finally {
            // Always increment progress and update UI so the counter moves even on failures
            completed++;
            updateBatchProgress(completed, tickets.length);
        }
    }
    
    // Hide processing overlay
    hideProcessingOverlay();
    
    // Clear the form
    if (currentTicketInput === 'type') {
        ticketTextarea.value = '';
        updateCharacterCount();
    } else {
        clearFileUpload();
    }
    
    // Show batch summary
    showBatchSummary(results);
    
    // Switch to ticket list tab
    setActiveTab('ticket-list');
}

function showBatchProcessingOverlay(total) {
    const overlay = document.getElementById('processingOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('hidden');
    overlay.innerHTML = `
        <div class="glass-card processing-card">
            <div class="processing-animation">
                <div class="processing-spinner"></div>
            </div>
            <h3>Processing Batch...</h3>
            <div class="batch-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: 0%"></div>
                </div>
                <p>Processing ticket <span id="ticketProgress">0</span> of ${total}</p>
            </div>
        </div>
    `;
}

function updateBatchProgress(completed, total) {
    const progress = document.querySelector('#processingOverlay .progress');
    const counter = document.getElementById('ticketProgress');
    if (progress) {
        progress.style.width = `${(completed / total) * 100}%`;
    }
    if (counter) {
        counter.textContent = completed;
    }
}

function showBatchSummary(results) {
    // Create a summary notification
    const priorityCounts = results.reduce((acc, r) => {
        const priority = r.priority.toLowerCase();
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {});
    
    const notification = document.createElement('div');
    notification.className = 'batch-summary glass-card';
    notification.innerHTML = `
        <div class="summary-header">
            <i class="fas fa-check-circle"></i>
            <h4>Batch Processing Complete</h4>
        </div>
        <div class="summary-content">
            <p>Successfully processed ${results.length} tickets:</p>
            <ul>
                ${Object.entries(priorityCounts)
                    .map(([priority, count]) => `<li>${count} ${priority} priority</li>`)
                    .join('')}
            </ul>
        </div>
        <button class="btn btn--sm btn--outline close-summary">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Add close button handler
    const closeBtn = notification.querySelector('.close-summary');
    if (closeBtn) {
        closeBtn.onclick = () => notification.remove();
    }
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

// Convert the original processTicket to use promises for batch processing
function processTicketAsync(content) {
    const formData = new FormData();
    formData.append('ticket', content);
    
    const apiBase = (window.location && window.location.protocol && window.location.protocol.startsWith('http'))
        ? window.location.origin
        : 'http://localhost:8000';
    const analyzeUrl = apiBase + '/analyze';

    return fetch(analyzeUrl, {
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
        const ticketId = 'T' + Date.now().toString().slice(-6);

        // Build ticket data from result (keep even if UI fails)
        const ticketData = {
            id: ticketId,
            content: content,
            priority: result && result.priority ? result.priority : 'unknown',
            confidence: result && typeof result.confidence === 'number' ? result.confidence : 0,
            priorityScores: result && result.priority_scores ? result.priority_scores : {}
        };

        // Try to update UI, but swallow errors so the promise stays fulfilled
        try {
            addTicketToList(ticketData);

            if (window.AppState) {
                window.AppState.updateStats(ticketData);
            }
        } catch (uiErr) {
            console.error('UI update error after processing ticket:', uiErr);
            // proceed — we still return ticketData so the batch progress can continue
        }

        return ticketData;
    });
}
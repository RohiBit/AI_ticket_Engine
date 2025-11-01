// Application statistics and state management
const AppState = {
    stats: {
        latestTickets: [], // Recent tickets for activity feed
    },

    // Update statistics when a new ticket is processed
    updateStats(ticketData) {
        // Update total count
        this.stats.totalTickets++;
        
        // Update priority distribution
        const priority = ticketData.priority.toLowerCase();
        this.stats.ticketsByPriority[priority] = (this.stats.ticketsByPriority[priority] || 0) + 1;
        
        // Add to recent activity (keep last 5)
        this.stats.latestTickets.unshift({
            id: ticketData.id,
            priority,
            timestamp: new Date().toISOString()
        });
        if (this.stats.latestTickets.length > 5) {
            this.stats.latestTickets.pop();
        }
        
        // Update dashboard
        this.updateDashboard();
    },

    // Update dashboard components
    updateDashboard() {
        // Overview Statistics
        const statsCard = document.querySelector('.stats-card');
        if (statsCard) {
            statsCard.innerHTML = `
                <h3>Overview Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Total Tickets</span>
                        <span class="stat-value">${this.stats.totalTickets}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">High Priority</span>
                        <span class="stat-value">${this.stats.ticketsByPriority.high || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Medium Priority</span>
                        <span class="stat-value">${this.stats.ticketsByPriority.medium || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Low Priority</span>
                        <span class="stat-value">${this.stats.ticketsByPriority.low || 0}</span>
                    </div>
                </div>
            `;
        }

        // Recent Activity
        const activityCard = document.querySelector('.activity-card');
        if (activityCard && this.stats.latestTickets.length > 0) {
            const activityHtml = this.stats.latestTickets.map(ticket => `
                <div class="activity-item priority-${ticket.priority}">
                    <span class="activity-id">${ticket.id}</span>
                    <span class="activity-priority">${ticket.priority.toUpperCase()}</span>
                    <span class="activity-time">${this.formatTimeAgo(new Date(ticket.timestamp))}</span>
                </div>
            `).join('');

            activityCard.innerHTML = `
                <h3>Recent Activity</h3>
                <div class="activity-list">
                    ${activityHtml}
                </div>
            `;
        }
    },

    // Update analytics page
    updateAnalytics() {
        // Key Metrics card
        const metricsCard = document.querySelector('.metrics-card');
        if (metricsCard) {
            metricsCard.innerHTML = `
                <h3>Key Metrics</h3>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <h4>Total Volume</h4>
                        <div class="metric-value">${this.stats.totalTickets}</div>
                    </div>
                    <div class="metric-item">
                        <h4>Priority Distribution</h4>
                        <div class="priority-bars">
                            ${this.renderPriorityBars()}
                        </div>
                    </div>
                </div>
            `;
        }

        // Ticket Trends chart
        const chartCard = document.querySelector('.chart-card');
        if (chartCard) {
            chartCard.innerHTML = `
                <h3>Ticket Trends</h3>
                <div class="trend-chart">
                    ${this.renderTrendChart()}
                </div>
            `;
        }
    },

    // Update knowledge graph visualization
    updateKnowledgeGraph() {
        const graphContainer = document.querySelector('.knowledge-graph-container');
        if (graphContainer && this.stats.totalTickets > 0) {
            // Replace empty state with a basic visualization
            graphContainer.innerHTML = `
                <div class="graph-visualization">
                    <div class="graph-stats">
                        <div class="graph-stat">
                            <span class="stat-label">Nodes</span>
                            <span class="stat-value">${this.stats.totalTickets}</span>
                        </div>
                        <div class="graph-stat">
                            <span class="stat-label">Connections</span>
                            <span class="stat-value">${Math.max(0, this.stats.totalTickets - 1)}</span>
                        </div>
                    </div>
                    <div class="graph-canvas">
                        <!-- Placeholder for actual graph visualization -->
                        <div class="graph-placeholder">
                            <div class="graph-node central">KB</div>
                            ${this.renderGraphNodes()}
                        </div>
                    </div>
                </div>
            `;
        }
    },

    // Helper: Format relative time
    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    },

    // Helper: Render priority distribution bars
    renderPriorityBars() {
        const total = this.stats.totalTickets || 1;
        const highPct = ((this.stats.ticketsByPriority.high || 0) / total * 100).toFixed(1);
        const medPct = ((this.stats.ticketsByPriority.medium || 0) / total * 100).toFixed(1);
        const lowPct = ((this.stats.ticketsByPriority.low || 0) / total * 100).toFixed(1);

        return `
            <div class="priority-bar">
                <div class="bar high" style="width: ${highPct}%"></div>
                <span class="bar-label">High ${highPct}%</span>
            </div>
            <div class="priority-bar">
                <div class="bar medium" style="width: ${medPct}%"></div>
                <span class="bar-label">Medium ${medPct}%</span>
            </div>
            <div class="priority-bar">
                <div class="bar low" style="width: ${lowPct}%"></div>
                <span class="bar-label">Low ${lowPct}%</span>
            </div>
        `;
    },

    // Helper: Render simple trend chart
    renderTrendChart() {
        const days = Object.keys(this.stats.ticketsByDay).sort();
        if (days.length === 0) return '<div class="no-data">No trend data yet</div>';

        const values = days.map(day => this.stats.ticketsByDay[day]);
        const max = Math.max(...values);
        const chartHeight = 200;

        const bars = days.map((day, i) => {
            const height = (values[i] / max * chartHeight) || 0;
            return `
                <div class="trend-bar" style="height: ${height}px" title="${day}: ${values[i]} tickets">
                    <span class="trend-value">${values[i]}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="trend-bars">
                ${bars}
            </div>
            <div class="trend-labels">
                ${days.map(day => `<span>${day.split('-')[2]}</span>`).join('')}
            </div>
        `;
    },

    // Helper: Render graph nodes
    renderGraphNodes() {
        if (this.stats.totalTickets === 0) return '';
        
        const nodes = [];
        const total = Math.min(8, this.stats.totalTickets); // Show up to 8 nodes
        const radius = 120; // Distance from center
        
        for (let i = 0; i < total; i++) {
            const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const priority = Object.keys(this.stats.ticketsByPriority)[i % 3];
            
            nodes.push(`
                <div class="graph-node" style="transform: translate(${x}px, ${y}px)">
                    <div class="node-dot ${priority}"></div>
                </div>
            `);
        }
        
        return nodes.join('');
    }
};

// Add to window for access from HTML
window.AppState = AppState;
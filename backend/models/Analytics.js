const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    metrics: {
        views: [{
            timestamp: {
                type: Date,
                default: Date.now
            },
            source: String,
            userAgent: String,
            location: {
                country: String,
                city: String
            }
        }],
        engagement: {
            likes: [{
                timestamp: Date,
                userId: mongoose.Schema.Types.ObjectId
            }],
            shares: [{
                timestamp: Date,
                platform: String,
                userId: mongoose.Schema.Types.ObjectId
            }],
            comments: [{
                timestamp: Date,
                content: String,
                userId: mongoose.Schema.Types.ObjectId
            }]
        },
        distribution: {
            channels: [{
                platform: String,
                metrics: {
                    impressions: Number,
                    clicks: Number,
                    conversions: Number
                },
                lastUpdated: Date
            }]
        }
    },
    sentiment: {
        overall: {
            score: Number,
            lastAnalyzed: Date
        },
        history: [{
            timestamp: Date,
            score: Number,
            source: String
        }]
    },
    performance: {
        loadTime: Number,
        errorRate: Number,
        availability: Number
    },
    timeSeriesData: [{
        date: {
            type: Date,
            required: true
        },
        metrics: {
            views: Number,
            likes: Number,
            shares: Number,
            comments: Number,
            sentiment: Number
        }
    }],
    aggregates: {
        daily: {
            date: Date,
            views: Number,
            engagement: {
                likes: Number,
                shares: Number,
                comments: Number
            },
            sentiment: Number
        },
        weekly: {
            weekStart: Date,
            views: Number,
            engagement: {
                likes: Number,
                shares: Number,
                comments: Number
            },
            sentiment: Number
        },
        monthly: {
            monthStart: Date,
            views: Number,
            engagement: {
                likes: Number,
                shares: Number,
                comments: Number
            },
            sentiment: Number
        }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
analyticsSchema.index({ contentId: 1 });
analyticsSchema.index({ company: 1 });
analyticsSchema.index({ 'timeSeriesData.date': 1 });
analyticsSchema.index({ 'aggregates.daily.date': 1 });
analyticsSchema.index({ 'aggregates.weekly.weekStart': 1 });
analyticsSchema.index({ 'aggregates.monthly.monthStart': 1 });

// Method to add view
analyticsSchema.methods.addView = async function(viewData) {
    this.metrics.views.push(viewData);
    await this.updateAggregates();
    return this.save();
};

// Method to add engagement
analyticsSchema.methods.addEngagement = async function(type, data) {
    this.metrics.engagement[type].push(data);
    await this.updateAggregates();
    return this.save();
};

// Method to update sentiment
analyticsSchema.methods.updateSentiment = async function(score, source) {
    this.sentiment.history.push({
        timestamp: new Date(),
        score,
        source
    });
    
    // Update overall sentiment
    const allScores = this.sentiment.history.map(h => h.score);
    this.sentiment.overall = {
        score: allScores.reduce((a, b) => a + b) / allScores.length,
        lastAnalyzed: new Date()
    };
    
    await this.updateAggregates();
    return this.save();
};

// Method to update time series data
analyticsSchema.methods.updateTimeSeriesData = async function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMetrics = {
        date: today,
        metrics: {
            views: this.metrics.views.filter(v => 
                v.timestamp.toDateString() === today.toDateString()
            ).length,
            likes: this.metrics.engagement.likes.filter(l => 
                l.timestamp.toDateString() === today.toDateString()
            ).length,
            shares: this.metrics.engagement.shares.filter(s => 
                s.timestamp.toDateString() === today.toDateString()
            ).length,
            comments: this.metrics.engagement.comments.filter(c => 
                c.timestamp.toDateString() === today.toDateString()
            ).length,
            sentiment: this.sentiment.overall.score
        }
    };

    const existingIndex = this.timeSeriesData.findIndex(
        d => d.date.toDateString() === today.toDateString()
    );

    if (existingIndex > -1) {
        this.timeSeriesData[existingIndex] = todayMetrics;
    } else {
        this.timeSeriesData.push(todayMetrics);
    }
};

// Method to update aggregates
analyticsSchema.methods.updateAggregates = async function() {
    await this.updateTimeSeriesData();
    
    // Update daily aggregate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.aggregates.daily = {
        date: today,
        views: this.metrics.views.filter(v => 
            v.timestamp.toDateString() === today.toDateString()
        ).length,
        engagement: {
            likes: this.metrics.engagement.likes.filter(l => 
                l.timestamp.toDateString() === today.toDateString()
            ).length,
            shares: this.metrics.engagement.shares.filter(s => 
                s.timestamp.toDateString() === today.toDateString()
            ).length,
            comments: this.metrics.engagement.comments.filter(c => 
                c.timestamp.toDateString() === today.toDateString()
            ).length
        },
        sentiment: this.sentiment.overall.score
    };

    // Similar updates for weekly and monthly aggregates
    // ... (implementation details omitted for brevity)
};

// Static method to get analytics by date range
analyticsSchema.statics.getByDateRange = async function(contentId, startDate, endDate) {
    return this.findOne({ contentId })
               .select('timeSeriesData')
               .where('timeSeriesData.date')
               .gte(startDate)
               .lte(endDate);
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
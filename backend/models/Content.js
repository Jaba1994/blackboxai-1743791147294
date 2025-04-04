const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'blog',
            'social_post',
            'email',
            'design_doc',
            'changelog',
            'internal_comm'
        ]
    },
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    metadata: {
        prompt: {
            type: String,
            required: true
        },
        aiModel: {
            type: String,
            required: true
        },
        generationParams: {
            temperature: Number,
            maxTokens: Number,
            topP: Number
        },
        processingTime: Number
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    figmaElements: [{
        fileId: String,
        nodeId: String,
        type: String,
        name: String,
        url: String,
        lastSync: Date
    }],
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        engagement: {
            likes: { type: Number, default: 0 },
            shares: { type: Number, default: 0 },
            comments: { type: Number, default: 0 }
        },
        sentiment: {
            score: { type: Number, default: 0 },
            lastAnalyzed: Date
        }
    },
    distribution: {
        channels: [{
            platform: {
                type: String,
                enum: ['website', 'twitter', 'linkedin', 'email', 'slack']
            },
            status: {
                type: String,
                enum: ['pending', 'published', 'failed'],
                default: 'pending'
            },
            publishedAt: Date,
            url: String,
            response: mongoose.Schema.Types.Mixed
        }],
        schedule: {
            publishAt: Date,
            timezone: String
        }
    },
    version: {
        type: Number,
        default: 1
    },
    revisions: [{
        content: String,
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        modifiedAt: {
            type: Date,
            default: Date.now
        },
        version: Number,
        changeLog: String
    }],
    tags: [{
        type: String,
        trim: true
    }],
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
contentSchema.index({ type: 1, status: 1 });
contentSchema.index({ author: 1 });
contentSchema.index({ company: 1 });
contentSchema.index({ 'distribution.channels.platform': 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ createdAt: -1 });

// Virtual for content preview
contentSchema.virtual('preview').get(function() {
    return this.content.substring(0, 200) + '...';
});

// Method to increment view count
contentSchema.methods.incrementViews = async function() {
    this.analytics.views += 1;
    return this.save();
};

// Method to update sentiment
contentSchema.methods.updateSentiment = async function(score) {
    this.analytics.sentiment = {
        score,
        lastAnalyzed: new Date()
    };
    return this.save();
};

// Method to add revision
contentSchema.methods.addRevision = async function(userId, newContent, changeLog) {
    this.revisions.push({
        content: this.content,
        modifiedBy: userId,
        version: this.version,
        changeLog
    });
    
    this.content = newContent;
    this.version += 1;
    
    return this.save();
};

// Static method to get popular content
contentSchema.statics.getPopular = function(limit = 10) {
    return this.find({ status: 'published' })
               .sort({ 'analytics.views': -1 })
               .limit(limit);
};

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
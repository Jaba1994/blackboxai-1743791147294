const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'editor'],
        default: 'user'
    },
    company: {
        name: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true
        },
        position: {
            type: String,
            trim: true
        }
    },
    settings: {
        contentPreferences: {
            tone: {
                type: String,
                enum: ['professional', 'casual', 'friendly', 'formal'],
                default: 'professional'
            },
            language: {
                type: String,
                default: 'en'
            }
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            contentGeneration: {
                type: Boolean,
                default: true
            },
            figmaSync: {
                type: Boolean,
                default: true
            }
        }
    },
    figmaIntegration: {
        accessToken: String,
        refreshToken: String,
        tokenExpiry: Date,
        lastSync: Date
    },
    apiKey: {
        type: String,
        unique: true,
        sparse: true
    },
    lastLogin: Date,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to generate API key
userSchema.methods.generateApiKey = function() {
    const apiKey = crypto.randomBytes(32).toString('hex');
    this.apiKey = apiKey;
    return apiKey;
};

// Method to validate Figma token
userSchema.methods.hasFigmaToken = function() {
    return !!(this.figmaIntegration && 
             this.figmaIntegration.accessToken && 
             this.figmaIntegration.tokenExpiry > new Date());
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.apiKey;
    delete obj.figmaIntegration;
    return obj;
};

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ 'company.name': 1 });
userSchema.index({ apiKey: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
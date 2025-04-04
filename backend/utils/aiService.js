const { OpenAI } = require('openai');
const logger = require('./logger');
const { APIError } = require('../middlewares/errorHandler');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        // Default parameters for content generation
        this.defaultParams = {
            temperature: 0.7,
            maxTokens: 1000,
            topP: 1,
            frequencyPenalty: 0,
            presencePenalty: 0
        };

        // Content type specific prompts
        this.promptTemplates = {
            blog: `Write a professional blog post about {topic}. 
                  Tone: {tone}
                  Target audience: {audience}
                  Key points to cover: {points}`,
            
            social_post: `Create a engaging social media post about {topic}.
                         Platform: {platform}
                         Tone: {tone}
                         Include hashtags: {hashtags}`,
            
            email: `Write a {type} email about {topic}.
                    Tone: {tone}
                    Target audience: {audience}
                    Call to action: {cta}`,
            
            design_doc: `Create a detailed design documentation for {topic}.
                        Include sections for:
                        - Overview
                        - Technical specifications
                        - Implementation details
                        - Design considerations`,
            
            changelog: `Write a changelog entry for {topic}.
                       Type: {type}
                       Version: {version}
                       Include sections for:
                       - New features
                       - Improvements
                       - Bug fixes`,
            
            internal_comm: `Create an internal communication about {topic}.
                          Type: {type}
                          Audience: {audience}
                          Key message: {message}`
        };
    }

    /**
     * Format prompt based on content type and parameters
     * @param {string} type - Content type
     * @param {Object} params - Parameters for prompt template
     * @returns {string} Formatted prompt
     */
    formatPrompt(type, params) {
        let template = this.promptTemplates[type];
        
        // Replace template variables with actual values
        Object.keys(params).forEach(key => {
            template = template.replace(
                new RegExp(`{${key}}`, 'g'),
                params[key]
            );
        });

        return template;
    }

    /**
     * Generate content using OpenAI API
     * @param {string} type - Content type
     * @param {Object} params - Generation parameters
     * @returns {Promise<Object>} Generated content and metadata
     */
    async generateContent(type, params) {
        try {
            const startTime = Date.now();
            
            // Format prompt based on content type and parameters
            const prompt = this.formatPrompt(type, params);
            
            // Merge default parameters with provided parameters
            const generationParams = {
                ...this.defaultParams,
                ...params.generationParams
            };

            // Call OpenAI API
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional content creator with expertise in creating high-quality, engaging content for various platforms and purposes."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: generationParams.temperature,
                max_tokens: generationParams.maxTokens,
                top_p: generationParams.topP,
                frequency_penalty: generationParams.frequencyPenalty,
                presence_penalty: generationParams.presencePenalty
            });

            const processingTime = Date.now() - startTime;

            // Log successful generation
            logger.info('Content generated successfully', {
                type,
                processingTime,
                tokens: completion.usage.total_tokens
            });

            // Return generated content and metadata
            return {
                content: completion.choices[0].message.content,
                metadata: {
                    prompt,
                    aiModel: 'gpt-4',
                    generationParams,
                    processingTime,
                    usage: completion.usage
                }
            };

        } catch (error) {
            logger.error('Error generating content:', {
                error: error.message,
                type,
                params
            });

            if (error.response) {
                throw new APIError(
                    `OpenAI API Error: ${error.response.data.error.message}`,
                    503
                );
            }

            throw new APIError('Error generating content', 500);
        }
    }

    /**
     * Analyze sentiment of content
     * @param {string} text - Text to analyze
     * @returns {Promise<number>} Sentiment score
     */
    async analyzeSentiment(text) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a sentiment analysis expert. Analyze the sentiment of the following text and return a score between -1 (very negative) and 1 (very positive)."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 50
            });

            const score = parseFloat(completion.choices[0].message.content);
            
            return {
                score,
                metadata: {
                    aiModel: 'gpt-4',
                    timestamp: new Date()
                }
            };

        } catch (error) {
            logger.error('Error analyzing sentiment:', {
                error: error.message,
                textLength: text.length
            });

            throw new APIError('Error analyzing sentiment', 500);
        }
    }

    /**
     * Improve content based on feedback
     * @param {string} content - Original content
     * @param {string} feedback - Feedback for improvement
     * @returns {Promise<string>} Improved content
     */
    async improveContent(content, feedback) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a content improvement expert. Improve the following content based on the provided feedback."
                    },
                    {
                        role: "user",
                        content: `Original content: ${content}\n\nFeedback: ${feedback}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500
            });

            return completion.choices[0].message.content;

        } catch (error) {
            logger.error('Error improving content:', {
                error: error.message,
                contentLength: content.length,
                feedbackLength: feedback.length
            });

            throw new APIError('Error improving content', 500);
        }
    }
}

// Export singleton instance
module.exports = new AIService();
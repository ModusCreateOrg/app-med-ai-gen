import { 
  ChatCompletionRequest, 
  ChatCompletionResponse 
} from 'common/models/chat';

/**
 * Pre-defined responses for specific medical queries
 */
const MEDICAL_RESPONSES: Record<string, string> = {
  // General health questions
  'photosynthesis': "I couldn't find an answer. Please try rephrasing your question or consult your healthcare provider.",
  'what is hypertension': 'Hypertension, or high blood pressure, is a common condition where the long-term force of blood against artery walls is high enough that it may eventually cause health problems like heart disease. Blood pressure is determined by the amount of blood your heart pumps and the resistance to blood flow in your arteries.',
  'what are symptoms of diabetes': 'Common symptoms of diabetes include increased thirst, frequent urination, extreme hunger, unexplained weight loss, fatigue, irritability, blurred vision, slow-healing sores, and frequent infections. Type 1 and Type 2 diabetes may present these symptoms differently.',
  
  // Medical terminology
  'what does cbc mean': 'CBC stands for Complete Blood Count. It\'s a blood test that evaluates your overall health and detects a wide range of disorders including anemia, infection, and leukemia. A CBC measures several components in your blood, including red and white blood cells, hemoglobin, hematocrit, and platelets.',
  'what is an mri': 'MRI (Magnetic Resonance Imaging) is a non-invasive imaging technology that produces detailed anatomical images. It uses a strong magnetic field and radio waves to generate images of organs and tissues in the body, helping doctors diagnose and monitor various conditions.',
  
  // Medical conditions
  'what is atrial fibrillation': 'Atrial fibrillation (AFib) is an irregular and often rapid heart rhythm that can lead to blood clots, stroke, heart failure, and other heart-related complications. During atrial fibrillation, the heart\'s upper chambers (atria) beat irregularly and out of coordination with the lower chambers (ventricles).',
  'what causes migraines': 'Migraines are believed to be caused by a combination of genetic and environmental factors. Triggers can include hormonal changes, certain foods and drinks, stress, sensory stimuli, changes in sleep patterns, physical exertion, weather changes, medications, and skipping meals.',
  
  // Medications
  'what are statins': 'Statins are medications that lower cholesterol levels in the blood. They work by blocking a substance your body needs to make cholesterol. They may also help your body reabsorb cholesterol that has built up in plaques in your artery walls, preventing further blockage in your blood vessels.'
};

/**
 * Generic medical responses for when no specific match is found
 */
const GENERIC_RESPONSES = [
  "Based on my understanding, this appears to be related to {TOPIC}. However, I recommend discussing this with your healthcare provider for personalized advice.",
  "While I can provide general information about {TOPIC}, your specific medical situation should be evaluated by a healthcare professional.",
  "I can tell you that {TOPIC} is a medical term that relates to {BRIEF_INFO}. For more detailed information about your specific case, please consult your doctor.",
  "I understand you're asking about {TOPIC}. This is commonly associated with {BRIEF_INFO}, but your healthcare provider can give you more specific guidance based on your medical history."
];

/**
 * Fallback response when the system cannot provide a relevant answer
 */
const FALLBACK_RESPONSE = "I couldn't find an answer. Please try rephrasing your question or consult your healthcare provider.";

/**
 * Extracts key topics from the user's message
 */
const extractTopics = (message: string): string[] => {
  // Simplified topic extraction - in a real implementation this would be more sophisticated
  const lowercaseMessage = message.toLowerCase();
  const commonTerms = [
    'blood', 'heart', 'pain', 'diabetes', 'cancer', 'pressure',
    'cholesterol', 'test', 'scan', 'x-ray', 'medication', 'treatment',
    'surgery', 'diagnosis', 'symptoms', 'doctor', 'hospital'
  ];
  
  return commonTerms.filter(term => lowercaseMessage.includes(term));
};

/**
 * Generates a response based on the user's query
 */
const generateResponse = (message: string): string => {
  const lowercaseMessage = message.toLowerCase();
  
  // Check for exact matches in predefined responses
  for (const [key, response] of Object.entries(MEDICAL_RESPONSES)) {
    if (lowercaseMessage.includes(key)) {
      return response;
    }
  }
  
  // Extract topics for generic responses
  const topics = extractTopics(message);
  if (topics.length > 0) {
    const topic = topics[0];
    const genericResponse = GENERIC_RESPONSES[Math.floor(Math.random() * GENERIC_RESPONSES.length)];
    
    // Brief information about common medical topics
    const topicInfo: Record<string, string> = {
      'blood': 'bloodstream circulation and components',
      'heart': 'cardiac function and cardiovascular health',
      'pain': 'sensory nervous system signals',
      'diabetes': 'blood sugar regulation',
      'cancer': 'abnormal cell growth',
      'pressure': 'force exerted by circulating blood on vessel walls',
      'cholesterol': 'lipid metabolism',
      'test': 'diagnostic procedures',
      'scan': 'imaging techniques',
      'x-ray': 'radiographic imaging',
      'medication': 'pharmaceutical treatments',
      'treatment': 'medical interventions',
      'surgery': 'invasive medical procedures',
      'diagnosis': 'identification of medical conditions',
      'symptoms': 'indications of medical conditions',
      'doctor': 'healthcare professionals',
      'hospital': 'medical facilities'
    };
    
    return genericResponse
      .replace('{TOPIC}', topic)
      .replace('{BRIEF_INFO}', topicInfo[topic] || 'an important health concept');
  }
  
  // Fallback response if no match found
  return FALLBACK_RESPONSE;
};

/**
 * Mock implementation of the Bedrock service API
 */
class BedrockService {
  /**
   * Simulate a chat completion request to AWS Bedrock
   */
  async createChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Get the last user message
        const lastUserMessage = request.messages
          .slice()
          .reverse()
          .find(msg => msg.role === 'user');
        
        if (!lastUserMessage) {
          throw new Error('No user message found in the request');
        }
        
        // Generate response
        const responseContent = generateResponse(lastUserMessage.content);
        
        // Return mock response
        resolve({
          message: {
            role: 'assistant',
            content: responseContent
          },
          usage: {
            promptTokens: lastUserMessage.content.length,
            completionTokens: responseContent.length,
            totalTokens: lastUserMessage.content.length + responseContent.length
          },
          model: 'anthropic.claude-3-haiku'
        });
      }, 1000); // 1 second delay to simulate network latency
    });
  }
}

// Export a singleton instance
export const bedrockService = new BedrockService(); 
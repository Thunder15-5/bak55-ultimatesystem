// frontend/services/content-adapter.ts
import { LocalizedContent, CulturalAdaptation } from '@/types/localization';

class ContentAdapterService {
  private culturalAdaptations: Map<string, CulturalAdaptation> = new Map();

  constructor() {
    this.initializeCulturalAdaptations();
  }

  private initializeCulturalAdaptations(): void {
    // East African adaptations
    this.culturalAdaptations.set('EAST_AFRICA', {
      region: 'East Africa',
      adaptations: {
        imagery: [
          'savannah landscapes',
          'urban cityscapes (Nairobi, Dar es Salaam)',
          'traditional markets',
          'beach scenes (Coastal Kenya, Tanzania)'
        ],
        colors: ['warm earth tones', 'bright festival colors', 'green and gold'],
        musicGenres: ['Bongo Flava', 'Afrobeats', 'Taarab', 'Gospel'],
        contentThemes: [
          'family and community',
          'entrepreneurship and hustle',
          'faith and spirituality',
          'love and relationships'
        ],
        culturalReferences: [
          'Sheng slang',
          'local celebrities',
          'popular dishes (ugali, nyama choma)',
          'festivals and holidays'
        ]
      },
      restrictions: {
        sensitiveTopics: ['tribalism', 'political conflicts', 'religious extremism'],
        culturalTaboos: ['disrespecting elders', 'public displays of affection'],
        legalRequirements: ['music copyright laws', 'content rating guidelines']
      }
    });

    // West African adaptations
    this.culturalAdaptations.set('WEST_AFRICA', {
      region: 'West Africa',
      adaptations: {
        imagery: [
          'bustling markets',
          'colorful fabrics',
          'urban landscapes (Lagos, Accra)',
          'traditional festivals'
        ],
        colors: ['vibrant greens', 'gold and yellow', 'rich blues'],
        musicGenres: ['Afrobeats', 'Highlife', 'Fuji', 'Juju'],
        contentThemes: [
          'success and ambition',
          'cultural pride',
          'family values',
          'social commentary'
        ],
        culturalReferences: [
          'Nigerian pidgin',
          'popular slang',
          'local cuisine (jollof rice, fufu)',
          'Nollywood references'
        ]
      },
      restrictions: {
        sensitiveTopics: ['religious conflicts', 'ethnic tensions', 'corruption'],
        culturalTaboos: ['disrespecting traditional rulers', 'certain hand gestures'],
        legalRequirements: ['broadcasting codes', 'cultural preservation laws']
      }
    });

    // Southern African adaptations
    this.culturalAdaptations.set('SOUTHERN_AFRICA', {
      region: 'Southern Africa',
      adaptations: {
        imagery: [
          'urban landscapes (Johannesburg, Cape Town)',
          'natural wonders (Table Mountain, Victoria Falls)',
          'township life',
          'wildlife and safari'
        ],
        colors: ['rainbow nation colors', 'earth tones', 'urban graffitis'],
        musicGenres: ['Amapiano', 'Gqom', 'Afrohouse', 'Kwaito'],
        contentThemes: [
          'unity in diversity',
          'urban life',
          'social justice',
          'cultural fusion'
        ],
        culturalReferences: [
          'local slang and languages',
          'township culture',
          'braai (barbecue) culture',
          'sports references'
        ]
      },
      restrictions: {
        sensitiveTopics: ['apartheid legacy', 'xenophobia', 'political history'],
        culturalTaboos: ['cultural appropriation', 'stereotyping'],
        legalRequirements: ['multilingual content', 'cultural representation laws']
      }
    });

    // North African adaptations
    this.culturalAdaptations.set('NORTH_AFRICA', {
      region: 'North Africa',
      adaptations: {
        imagery: [
          'ancient architecture',
          'desert landscapes',
          'coastal scenes',
          'urban centers (Cairo, Casablanca)'
        ],
        colors: ['earth tones', 'Islamic geometric patterns', 'Mediterranean blues'],
        musicGenres: ['Raï', 'Chaabi', 'Mahraganat', 'Traditional Arabic'],
        contentThemes: [
          'family and tradition',
          'modern vs traditional',
          'spirituality',
          'social change'
        ],
        culturalReferences: [
          'Arabic poetry and proverbs',
          'local dialects',
          'traditional clothing',
          'culinary references'
        ]
      },
      restrictions: {
        sensitiveTopics: ['religious criticism', 'political leadership', 'social unrest'],
        culturalTaboos: ['alcohol consumption', 'immodest dress', 'blasphemy'],
        legalRequirements: ['Islamic content guidelines', 'cultural preservation laws']
      }
    });
  }

  adaptContent(content: LocalizedContent, targetRegion: string): LocalizedContent {
    const adaptation = this.culturalAdaptations.get(targetRegion);
    if (!adaptation) return content;

    // Create adapted content
    const adaptedContent: LocalizedContent = {
      ...content,
      metadata: {
        ...content.metadata,
        culturallyAdapted: true,
        regionSpecific: true,
        lastUpdated: new Date(),
        adaptedBy: 'AI Content Adapter'
      }
    };

    // Apply cultural adaptations to each translation
    Object.keys(adaptedContent.translations).forEach(language => {
      const translation = adaptedContent.translations[language];
      
      // Add cultural context to titles and descriptions
      if (translation.title) {
        translation.title = this.adaptTitle(translation.title, adaptation);
      }
      
      if (translation.description) {
        translation.description = this.adaptDescription(translation.description, adaptation);
      }

      if (translation.content) {
        translation.content = this.adaptContentText(translation.content, adaptation);
      }
    });

    return adaptedContent;
  }

  private adaptTitle(title: string, adaptation: CulturalAdaptation): string {
    // Add culturally relevant prefixes/suffixes or modify based on region
    const prefixes = {
      'EAST_AFRICA': ['Vibe: ', 'Banger: ', '🔥 '],
      'WEST_AFRICA': ['Bop: ', '🔥 ', 'Afro '],
      'SOUTHERN_AFRICA': ['Jam: ', 'Piano: ', '🎵 '],
      'NORTH_AFRICA': ['🎶 ', 'Arabic: ', 'Traditional: ']
    };

    const regionPrefixes = prefixes[adaptation.region as keyof typeof prefixes] || [''];
    const randomPrefix = regionPrefixes[Math.floor(Math.random() * regionPrefixes.length)];
    
    return randomPrefix + title;
  }

  private adaptDescription(description: string, adaptation: CulturalAdaptation): string {
    // Add culturally relevant context to descriptions
    const culturalEnhancements = adaptation.adaptations.culturalReferences;
    const randomEnhancement = culturalEnhancements[Math.floor(Math.random() * culturalEnhancements.length)];
    
    return `${description} | ${this.capitalizeFirstLetter(randomEnhancement)} vibes`;
  }

  private adaptContentText(content: string, adaptation: CulturalAdaptation): string {
    // Replace generic references with culturally specific ones
    let adaptedContent = content;

    // Replace music genre references
    adaptation.adaptations.musicGenres.forEach(genre => {
      adaptedContent = adaptedContent.replace(/\[GENRE\]/g, genre);
    });

    // Replace location references
    adaptation.adaptations.imagery.forEach(image => {
      adaptedContent = adaptedContent.replace(/\[SCENE\]/g, image);
    });

    return adaptedContent;
  }

  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  validateContent(content: string, targetRegion: string): { isValid: boolean; issues: string[] } {
    const adaptation = this.culturalAdaptations.get(targetRegion);
    const issues: string[] = [];

    if (!adaptation) {
      return { isValid: true, issues: [] }; // No adaptation rules for region
    }

    // Check for sensitive topics
    adaptation.restrictions.sensitiveTopics.forEach(topic => {
      if (content.toLowerCase().includes(topic.toLowerCase())) {
        issues.push(`Contains sensitive topic: ${topic}`);
      }
    });

    // Check for cultural taboos
    adaptation.restrictions.culturalTaboos.forEach(taboo => {
      if (content.toLowerCase().includes(taboo.toLowerCase())) {
        issues.push(`Violates cultural taboo: ${taboo}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  getRegionalAdaptation(region: string): CulturalAdaptation | undefined {
    return this.culturalAdaptations.get(region);
  }

  generateCulturalRecommendations(content: string, targetRegion: string): string[] {
    const adaptation = this.culturalAdaptations.get(targetRegion);
    const recommendations: string[] = [];

    if (!adaptation) return recommendations;

    // Check if content uses regional imagery
    const hasRegionalImagery = adaptation.adaptations.imagery.some(image => 
      content.toLowerCase().includes(image.toLowerCase())
    );

    if (!hasRegionalImagery) {
      recommendations.push(`Consider adding ${adaptation.region}-specific imagery references`);
    }

    // Check for cultural references
    const hasCulturalReferences = adaptation.adaptations.culturalReferences.some(ref =>
      content.toLowerCase().includes(ref.toLowerCase())
    );

    if (!hasCulturalReferences) {
      recommendations.push(`Include local cultural references to better connect with ${adaptation.region} audience`);
    }

    return recommendations;
  }
}

export const contentAdapterService = new ContentAdapterService();

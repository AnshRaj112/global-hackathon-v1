# Daily Question Rotation System

## Overview

The Gramps Memory application now features a daily question rotation system that provides users with fresh, engaging questions every day. This keeps conversations interesting and encourages users to return daily to share their memories.

## How It Works

### Question Sets
The system includes **4 different sets** of questions, each with 8 conversation topics:

1. **Set 1**: Original comprehensive questions
2. **Set 2**: Alternative questions with different focus areas
3. **Set 3**: More personal and reflective questions
4. **Set 4**: Deeper wisdom and legacy-focused questions

### Daily Rotation
- Questions change every day based on the day of the year
- The system cycles through all 4 sets continuously
- Both text and voice conversations use the same daily questions
- Questions are synchronized across all users

### Question Categories
Each set includes questions for these 8 topics:
- **Childhood Memories**: Early life experiences and stories
- **Family Stories**: Family history and traditions
- **Career & Work**: Professional journey and achievements
- **Love & Relationships**: Marriage, friendship, and romance
- **Adventures & Travel**: Life experiences and journeys
- **Retirement & Golden Years**: Life after work
- **Grandchildren & Legacy**: Family legacy and values
- **Life Lessons & Wisdom**: Hard-earned wisdom and advice

## Technical Implementation

### Files Modified
- `src/utils/conversationTopics.ts` - Central question management
- `src/components/VoiceConversation.tsx` - Voice conversation component
- `src/components/MemoryConversation.tsx` - Text conversation component

### Key Features
- **Consistent Questions**: Both voice and text modes show identical questions
- **Daily Rotation**: Questions change automatically each day
- **Senior-Focused**: All questions are tailored for people in their 60s, 70s, and 80s
- **Legacy-Focused**: Questions emphasize family, grandchildren, and wisdom sharing

## Benefits

1. **Fresh Content**: Users see new questions every day
2. **Engagement**: Encourages daily return visits
3. **Variety**: 4 different question styles keep conversations interesting
4. **Consistency**: Same questions across all conversation modes
5. **Relevance**: Age-appropriate questions for senior users

## Example Question Variations

### Childhood Memories - Set 1
"Tell me about your childhood home. What was it like growing up there?"

### Childhood Memories - Set 2  
"What was your favorite childhood memory? Why does it stand out to you?"

### Childhood Memories - Set 3
"Tell me about your childhood pets. What were their names and personalities?"

### Childhood Memories - Set 4
"What was your favorite childhood book or story? Why did you love it?"

This system ensures that every day brings new opportunities for meaningful conversations and memory preservation!

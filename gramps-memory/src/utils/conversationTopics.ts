interface ConversationTopic {
  id: string;
  title: string;
  description: string;
  prompts: string[];
  category: string;
}

// Multiple sets of questions for daily rotation
const QUESTION_SETS = {
  set1: [
    {
      id: 'childhood',
      title: 'Childhood Memories',
      description: 'Share stories from your early years',
      category: 'childhood',
      prompts: [
        "Tell me about your childhood home. What was it like growing up there?",
        "What games did you play as a child? Do you remember any that your grandchildren might enjoy?",
        "Who were your best friends growing up? Are you still in touch with any of them?",
        "What was your favorite subject in school? What did you want to be when you grew up?",
        "Tell me about a special holiday or celebration from your childhood that you still remember fondly."
      ]
    },
    {
      id: 'family',
      title: 'Family Stories',
      description: 'Preserve your family history',
      category: 'family',
      prompts: [
        "Tell me about your parents. What were they like and what did you learn from them?",
        "Do you have any siblings? What was your relationship like growing up and now?",
        "Tell me about your grandparents. What stories did they share with you that you'd like to pass down?",
        "What family traditions do you remember from your childhood that you've carried on?",
        "Tell me about your children and grandchildren. What makes you most proud of them?"
      ]
    },
    {
      id: 'career',
      title: 'Career & Work',
      description: 'Share your professional journey',
      category: 'career',
      prompts: [
        "What was your first job? How did you get it and what did you learn from it?",
        "Tell me about your career path. How did you choose your profession and did it turn out as expected?",
        "What was your favorite job and why? What made it special?",
        "Tell me about a challenging project or achievement at work that you're still proud of.",
        "What advice would you give to your grandchildren about choosing a career?"
      ]
    },
    {
      id: 'love',
      title: 'Love & Relationships',
      description: 'Stories of love and friendship',
      category: 'love',
      prompts: [
        "How did you meet your spouse/partner? What was it like in those early days?",
        "Tell me about your wedding day. What made it special and memorable?",
        "What's the secret to a long-lasting relationship? What have you learned over the years?",
        "Tell me about your closest friends throughout life. How have your friendships changed over time?",
        "What's the most romantic thing that ever happened to you? What about something romantic you did for your partner?"
      ]
    },
    {
      id: 'adventures',
      title: 'Adventures & Travel',
      description: 'Your life adventures and travels',
      category: 'adventures',
      prompts: [
        "What's the most exciting trip you've ever taken? Where did you go and what made it special?",
        "Tell me about a place you've always wanted to visit. Have you been there yet?",
        "What's the most interesting person you've met while traveling? What made them memorable?",
        "Tell me about a time you tried something new or adventurous. How did it turn out?",
        "What's your favorite place in the world and why? What makes it special to you?"
      ]
    },
    {
      id: 'retirement',
      title: 'Retirement & Golden Years',
      description: 'Life after work and new beginnings',
      category: 'retirement',
      prompts: [
        "How did you decide when to retire? Was it the right time?",
        "What was the biggest adjustment when you retired? How did you adapt?",
        "What new hobbies or interests have you discovered in retirement?",
        "Tell me about your daily routine now. How do you like to spend your time?",
        "What advice would you give to someone about to retire?"
      ]
    },
    {
      id: 'grandchildren',
      title: 'Grandchildren & Legacy',
      description: 'Stories about your grandchildren and the legacy you want to leave',
      category: 'grandchildren',
      prompts: [
        "Tell me about your grandchildren. What makes each one special to you?",
        "What's the best advice you've given to your grandchildren?",
        "What traditions or values do you hope to pass down to future generations?",
        "Tell me about a special moment you've shared with your grandchildren.",
        "What do you hope your grandchildren will remember about you?"
      ]
    },
    {
      id: 'wisdom',
      title: 'Life Lessons & Wisdom',
      description: 'Share the wisdom you have gained',
      category: 'wisdom',
      prompts: [
        "What's the most important lesson life has taught you? How has it shaped who you are?",
        "If you could give advice to your younger self, what would it be?",
        "What values are most important to you and how did you develop them?",
        "Tell me about a time you overcame a difficult challenge. What did you learn from it?",
        "What makes you most proud in life? What would you like to be remembered for?"
      ]
    }
  ],
  set2: [
    {
      id: 'childhood',
      title: 'Childhood Memories',
      description: 'Share stories from your early years',
      category: 'childhood',
      prompts: [
        "What was your favorite childhood memory? Why does it stand out to you?",
        "Tell me about your childhood neighborhood. What made it special?",
        "What was your favorite toy or game as a child? Do you still have any of them?",
        "Tell me about a childhood friend who had a big impact on your life.",
        "What was the most exciting thing that happened to you as a child?"
      ]
    },
    {
      id: 'family',
      title: 'Family Stories',
      description: 'Preserve your family history',
      category: 'family',
      prompts: [
        "Tell me about your family's heritage. Where did your ancestors come from?",
        "What family recipes have been passed down through generations?",
        "Tell me about a family member who was particularly influential in your life.",
        "What family stories do you remember hearing as a child that you'd like to preserve?",
        "How has your family changed over the years? What traditions have stayed the same?"
      ]
    },
    {
      id: 'career',
      title: 'Career & Work',
      description: 'Share your professional journey',
      category: 'career',
      prompts: [
        "What was the most rewarding part of your career?",
        "Tell me about a mentor or colleague who influenced your professional life.",
        "What was the biggest challenge you faced in your career and how did you overcome it?",
        "How did your career change over the years? What was the biggest shift?",
        "What skills did you develop that you're most proud of?"
      ]
    },
    {
      id: 'love',
      title: 'Love & Relationships',
      description: 'Stories of love and friendship',
      category: 'love',
      prompts: [
        "What was the most important relationship in your life and why?",
        "Tell me about how you knew your spouse/partner was 'the one'.",
        "What's the key to maintaining strong friendships over many years?",
        "Tell me about a friendship that has lasted decades. What kept it strong?",
        "What's the most meaningful gift you've ever given or received in a relationship?"
      ]
    },
    {
      id: 'adventures',
      title: 'Adventures & Travel',
      description: 'Your life adventures and travels',
      category: 'adventures',
      prompts: [
        "What's the most unexpected adventure you've ever had?",
        "Tell me about a place you visited that completely surprised you.",
        "What's the most interesting cultural experience you've had while traveling?",
        "Tell me about a time you got lost or had an unexpected detour that turned into a great memory.",
        "What's the most beautiful place you've ever seen?"
      ]
    },
    {
      id: 'retirement',
      title: 'Retirement & Golden Years',
      description: 'Life after work and new beginnings',
      category: 'retirement',
      prompts: [
        "What was the most surprising thing about retirement?",
        "Tell me about a new skill or hobby you've learned since retiring.",
        "How has your perspective on life changed since retiring?",
        "What's the best part of having more free time?",
        "Tell me about a new friendship you've made in retirement."
      ]
    },
    {
      id: 'grandchildren',
      title: 'Grandchildren & Legacy',
      description: 'Stories about your grandchildren and the legacy you want to leave',
      category: 'grandchildren',
      prompts: [
        "What's the funniest thing one of your grandchildren has ever said to you?",
        "Tell me about a time you taught your grandchildren something important.",
        "What family stories do you most enjoy sharing with your grandchildren?",
        "How do you hope your grandchildren will remember their time with you?",
        "What values do you try to model for your grandchildren?"
      ]
    },
    {
      id: 'wisdom',
      title: 'Life Lessons & Wisdom',
      description: 'Share the wisdom you have gained',
      category: 'wisdom',
      prompts: [
        "What would you tell your 20-year-old self if you could?",
        "What's the most important decision you ever made and why?",
        "How do you define success? Has that definition changed over time?",
        "What's the best piece of advice you ever received?",
        "What do you wish you had known earlier in life?"
      ]
    }
  ],
  set3: [
    {
      id: 'childhood',
      title: 'Childhood Memories',
      description: 'Share stories from your early years',
      category: 'childhood',
      prompts: [
        "Tell me about your childhood pets. What were their names and personalities?",
        "What was your favorite place to play as a child? Why was it special?",
        "Tell me about a childhood birthday that was particularly memorable.",
        "What was the most exciting thing you did during summer vacation as a child?",
        "Tell me about a childhood fear you had and how you overcame it."
      ]
    },
    {
      id: 'family',
      title: 'Family Stories',
      description: 'Preserve your family history',
      category: 'family',
      prompts: [
        "Tell me about your family's holiday traditions. Which one is your favorite?",
        "What family heirlooms do you have and what stories do they tell?",
        "Tell me about a family reunion or gathering that was particularly special.",
        "What family jokes or sayings have been passed down through generations?",
        "Tell me about a family member who was known for their special talents or skills."
      ]
    },
    {
      id: 'career',
      title: 'Career & Work',
      description: 'Share your professional journey',
      category: 'career',
      prompts: [
        "What was the most interesting project you ever worked on?",
        "Tell me about a time you had to learn something completely new for work.",
        "What was the most important lesson you learned from a work mistake?",
        "How did technology change your field during your career?",
        "What was the most satisfying moment in your professional life?"
      ]
    },
    {
      id: 'love',
      title: 'Love & Relationships',
      description: 'Stories of love and friendship',
      category: 'love',
      prompts: [
        "Tell me about your first love. What made it special?",
        "What's the most romantic gesture you've ever made or received?",
        "How did you and your spouse/partner handle disagreements over the years?",
        "Tell me about a friend who became like family to you.",
        "What's the secret to staying connected with friends as you get older?"
      ]
    },
    {
      id: 'adventures',
      title: 'Adventures & Travel',
      description: 'Your life adventures and travels',
      category: 'adventures',
      prompts: [
        "What's the most adventurous thing you've ever done?",
        "Tell me about a trip that didn't go as planned but turned out great.",
        "What's the most interesting food you've ever tried while traveling?",
        "Tell me about a time you had to be brave while traveling.",
        "What's the most peaceful place you've ever visited?"
      ]
    },
    {
      id: 'retirement',
      title: 'Retirement & Golden Years',
      description: 'Life after work and new beginnings',
      category: 'retirement',
      prompts: [
        "What's the most fulfilling thing you do in retirement?",
        "Tell me about a new interest you've discovered since retiring.",
        "How do you stay active and healthy in retirement?",
        "What's the best part about having more time for family?",
        "Tell me about a goal you've achieved in retirement."
      ]
    },
    {
      id: 'grandchildren',
      title: 'Grandchildren & Legacy',
      description: 'Stories about your grandchildren and the legacy you want to leave',
      category: 'grandchildren',
      prompts: [
        "What's the most heartwarming thing one of your grandchildren has done?",
        "Tell me about a tradition you've started with your grandchildren.",
        "What's the most important life lesson you want to teach your grandchildren?",
        "How do you stay connected with your grandchildren who live far away?",
        "What's your favorite activity to do with your grandchildren?"
      ]
    },
    {
      id: 'wisdom',
      title: 'Life Lessons & Wisdom',
      description: 'Share the wisdom you have gained',
      category: 'wisdom',
      prompts: [
        "What's the most important thing you've learned about happiness?",
        "How do you stay positive during difficult times?",
        "What's the most valuable lesson you've learned from a mistake?",
        "What advice would you give to someone about growing older gracefully?",
        "What's the most important thing you've learned about love?"
      ]
    }
  ],
  set4: [
    {
      id: 'childhood',
      title: 'Childhood Memories',
      description: 'Share stories from your early years',
      category: 'childhood',
      prompts: [
        "What was your favorite childhood book or story? Why did you love it?",
        "Tell me about a time you got in trouble as a child. What happened?",
        "What was your favorite childhood meal or treat?",
        "Tell me about a childhood dream or aspiration you had.",
        "What was the most exciting day of your childhood?"
      ]
    },
    {
      id: 'family',
      title: 'Family Stories',
      description: 'Preserve your family history',
      category: 'family',
      prompts: [
        "Tell me about your family's most cherished tradition.",
        "What family member are you most like and why?",
        "Tell me about a family secret or mystery that was eventually solved.",
        "What's the most important thing your family taught you?",
        "Tell me about a family member who overcame great challenges."
      ]
    },
    {
      id: 'career',
      title: 'Career & Work',
      description: 'Share your professional journey',
      category: 'career',
      prompts: [
        "What was the most creative solution you ever came up with at work?",
        "Tell me about a time you had to stand up for what you believed in at work.",
        "What was the most meaningful recognition you ever received?",
        "How did you balance work and family life?",
        "What was the most important skill you developed that wasn't job-related?"
      ]
    },
    {
      id: 'love',
      title: 'Love & Relationships',
      description: 'Stories of love and friendship',
      category: 'love',
      prompts: [
        "What's the most important quality in a life partner?",
        "Tell me about a time when a friend really came through for you.",
        "What's the most meaningful compliment you've ever received?",
        "How do you show love to the people who matter most to you?",
        "Tell me about a relationship that taught you something important about yourself."
      ]
    },
    {
      id: 'adventures',
      title: 'Adventures & Travel',
      description: 'Your life adventures and travels',
      category: 'adventures',
      prompts: [
        "What's the most spontaneous trip you ever took?",
        "Tell me about a place you visited that felt like home.",
        "What's the most interesting person you met while traveling?",
        "Tell me about a time you had to step out of your comfort zone while traveling.",
        "What's the most beautiful sunset or sunrise you've ever seen?"
      ]
    },
    {
      id: 'retirement',
      title: 'Retirement & Golden Years',
      description: 'Life after work and new beginnings',
      category: 'retirement',
      prompts: [
        "What's the most surprising thing you've learned about yourself in retirement?",
        "Tell me about a new friendship you've made since retiring.",
        "What's the most rewarding volunteer work you've done?",
        "How do you keep your mind sharp in retirement?",
        "What's the best advice you'd give to someone approaching retirement?"
      ]
    },
    {
      id: 'grandchildren',
      title: 'Grandchildren & Legacy',
      description: 'Stories about your grandchildren and the legacy you want to leave',
      category: 'grandchildren',
      prompts: [
        "What's the most surprising thing one of your grandchildren has taught you?",
        "Tell me about a time you were proud of one of your grandchildren.",
        "What's the most important value you want to pass on to future generations?",
        "How do you hope your grandchildren will remember your home?",
        "What's the most important story you want your grandchildren to know about your life?"
      ]
    },
    {
      id: 'wisdom',
      title: 'Life Lessons & Wisdom',
      description: 'Share the wisdom you have gained',
      category: 'wisdom',
      prompts: [
        "What's the most important thing you've learned about forgiveness?",
        "How do you find meaning in everyday life?",
        "What's the most important thing you've learned about money?",
        "What's the most important thing you've learned about health?",
        "What's the most important thing you've learned about family?"
      ]
    }
  ]
};

// Function to get the current day's question set
export function getDailyConversationTopics(): ConversationTopic[] {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Cycle through the 4 question sets based on the day of the year
  const setNumber = (dayOfYear % 4) + 1;
  const setKey = `set${setNumber}` as keyof typeof QUESTION_SETS;
  
  return QUESTION_SETS[setKey];
}

// Export the interface for use in other files
export type { ConversationTopic };

export interface PromptConfig {
  role: string;
  structure: string;
  tone: string;
}

export const SUBJECT_CATEGORIES = {
  MATH: ['math', 'mathematics', 'algebra', 'geometry', 'calculus', 'statistics', 'physics'],
  SCIENCE: ['science', 'biology', 'chemistry', 'physics', 'environmental', 'anatomy'],
  HUMANITIES: ['history', 'social studies', 'geography', 'civics', 'economics'],
  LITERATURE: ['english', 'literature', 'language arts', 'reading', 'writing'],
  TECH: ['computer', 'technology', 'programming', 'coding', 'ict'],
};

export function getSubjectCategory(subject: string): keyof typeof SUBJECT_CATEGORIES | 'GENERAL' {
  const s = subject.toLowerCase();
  for (const [key, keywords] of Object.entries(SUBJECT_CATEGORIES)) {
    if (keywords.some(k => s.includes(k))) return key as keyof typeof SUBJECT_CATEGORIES;
  }
  return 'GENERAL';
}

export function getGradeLevelInfo(grade: string): { tone: string; complexity: string } {
  const g = grade.toLowerCase();
  
  // Primary (Grades 1-5)
  if (['1', '2', '3', '4', '5'].some(num => g.includes(num)) && !g.includes('10') && !g.includes('11') && !g.includes('12')) {
    return {
      tone: "Fun, encouraging, and storytelling-based. Use emojis and simple analogies.",
      complexity: "Simple sentences. Avoid jargon. treating the student like a curious child."
    };
  }
  
  // Middle School (Grades 6-8)
  if (['6', '7', '8'].some(num => g.includes(num))) {
    return {
      tone: "Engaging, clear, and structured. Like a helpful mentor.",
      complexity: "Moderate vocabulary. Define new terms clearly. Focus on understanding 'why'."
    };
  }
  
  // High School (Grades 9-12)
  if (['9', '10', '11', '12'].some(num => g.includes(num))) {
    return {
      tone: "Academic, professional, yet accessible. Like a college prep tutor.",
      complexity: "Standard academic level. Use proper terminology. Encourage critical thinking."
    };
  }

  // Default / University / Adult
  return {
    tone: "Professional, comprehensive, and expert. Like a professor.",
    complexity: "Advanced. detailed, and nuanced. Focus on mastery and application."
  };
}

export const TEMPLATES = {
  MATH: `
### 🎯 Learning Goal
- [Single bullet about what we are calculating or solving]

### 📐 Key Formulas & Concepts
- **Formula Name**: $$ [Formula] $$
  - *Where*: $x$ = ..., $y$ = ...
- **Concept Definition**:
  - [Definition in simple terms]

### 👣 Step-by-Step Example
**Problem**: [Create a relevant example problem based on the text]
1. **Analyze**: [Break down what is given]
2. **Setup**: [Set up the equation or approach]
3. **Solved**: [The final calculation steps]

### 💡 Common Mistakes to Avoid
- **Mistake 1**: [Description]
- **Mistake 2**: [Description]

### 📝 Practice Challenge
1. [One problem for the student to try]
`,

  SCIENCE: `
### 🔬 The Big Idea
- [Bullet 1: Core phenomenon]
- [Bullet 2: Why it happens]

### 🗝️ Key Definitions
- **[Term-1]**:
  - [Simple definition]
- **[Term-2]**:
  - [Simple definition]

### ⚙️ How It Works (Process)
1. **First Stage**: [What happens first?]
2. **Middle Stage**: [What happens next?]
3. **Final Outcome**: [What is the result?]

### 👁️ Visualizing It
- **Analogy**: [Compare to something real-life]
- **Diagram**: [Describe what a diagram would show]

### 🧪 Real-World Applications
- [Application 1]
- [Application 2]
`,

  HUMANITIES: `
### 📜 Historical Context
- **Time Period**: [When?]
- **Location**: [Where?]
- **Background**: [Brief context]

### 🕰️ Timeline & Key Events
1. **[Date]**: [Event Description]
2. **[Date]**: [Event Description]
3. **[Date]**: [Event Description]

### 👥 Key Figures
- **[Person 1]**:
  - [Role/Significance]
- **[Person 2]**:
  - [Role/Significance]

### 🔗 Cause & Effect Breakdown
- **Causes**:
  - [Reason 1]
  - [Reason 2]
- **Effects**:
  - [Result 1]
  - [Result 2]

### 🧠 Why It Matters Today
- [Relevance Point 1]
- [Relevance Point 2]
`,

  LITERATURE: `
### 📖 Synopsis
- **Plot**: [Bullet point summary]
- **Setting**: [Bullet point description]

### 🎭 Characters
- **[Name 1]**:
  - [Role/Archetype]
  - [Key Trait]
- **[Name 2]**:
  - [Role/Archetype]
  - [Key Trait]

### 🎨 Themes & Symbols
- **Theme: [Theme Name]**
  - [Explanation]
- **Symbol: [Symbol Name]**
  - [Meaning]

### 🗣️ Important Quotes
- > "[Quote 1]"
  - **Analysis**: [What this shows]
- > "[Quote 2]"
  - **Analysis**: [What this shows]
`,

  GENERAL: `
### 📌 Overview
- [Main Point 1]
- [Main Point 2]
- [Main Point 3]

### 🔑 Key Takeaways
1. [Key Takeaway 1]
2. [Key Takeaway 2]
3. [Key Takeaway 3]
4. [Key Takeaway 4]

### 📝 Detailed Breakdown
- **Topic A**:
  - [Detail 1]
  - [Detail 2]
- **Topic B**:
  - [Detail 1]
  - [Detail 2]

### 🧠 Core Concepts
- **[Concept 1]**: [Definition]
- **[Concept 2]**: [Definition]

### 💡 Study Tip
- [Motivational or technical tip to remember this]
`
};

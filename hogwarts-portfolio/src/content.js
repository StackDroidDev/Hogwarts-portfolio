export const content = {
  name: "Joel Biju",
  role: "App Developer • Photographer",
  email: "rqf.odyssey@gmail.com",
  github: "https://github.com/StackDroidDev",
  linkedin: "https://www.linkedin.com/in/stackdroiddev",
  education: "BTech CSE (AI/ML) at NST Pune; St. Joseph School, Bhopal till 2025",
  interests: "apps, singing, video and music editing, photography",
  navigationHint: "Scroll to meet the Sorting Hat",
  formEndpoint: "",

  loading: {
    platform: "Platform 9¾",
    enter: "Enter",
    skip: "Skip"
  },

  sortingHat: {
    initialSpeech: "Hmm... a new visitor. Let me see...",
    subsequentSpeech: "Ah, welcome back. Still feeling true to your house, or shall we sort you anew?",
    btnDecide: "Let the hat decide",
    btnChoose: "I know my house",
    btnChangeHouse: "Change house",
    btnSkip: "Skip ceremony",
    quiz: [
      {
        question: "Which mystical light draws your path forward?",
        options: [
          { text: "A blazing candle in the dark", houses: { gryffindor: 2, hufflepuff: 1 } },
          { text: "A flash of crackling lightning", houses: { slytherin: 2, gryffindor: 1 } },
          { text: "The serene glow of the full moon", houses: { ravenclaw: 2, slytherin: 1 } }
        ]
      },
      {
        question: "Choose a companion for the long journey:",
        options: [
          { text: "A keen-eyed screech owl", houses: { ravenclaw: 2, gryffindor: 1 } },
          { text: "A sleek, quiet midnight cat", houses: { slytherin: 2, ravenclaw: 1 } },
          { text: "An honest, earthbound toad", houses: { hufflepuff: 2, gryffindor: 0 } }
        ]
      },
      {
        question: "Which innate virtue echoes deepest within you?",
        options: [
          { text: "Unyielding courage in adversity", houses: { gryffindor: 3, hufflepuff: 0 } },
          { text: "Sharp cleverness and vision", houses: { ravenclaw: 2, slytherin: 2 } },
          { text: "Loyal kindness and perseverance", houses: { hufflepuff: 3, ravenclaw: 0 } }
        ]
      }
    ],
    crests: [
      { id: "gryffindor", name: "Gryffindor", symbol: "Lion", subtitle: "Bravery & Chivalry", accent: "#d13636" },
      { id: "slytherin", name: "Slytherin", symbol: "Serpent", subtitle: "Ambition & Resourcefulness", accent: "#1e5a38" },
      { id: "ravenclaw", name: "Ravenclaw", symbol: "Eagle", subtitle: "Wisdom & Wit", accent: "#0d6bde" },
      { id: "hufflepuff", name: "Hufflepuff", symbol: "Badger", subtitle: "Loyalty & Dedication", accent: "#be881c" }
    ]
  },

  greatHall: {
    welcomeTitle: "The Great Hall",
    introStatement: "Welcome. I turn ideas into apps, and moments into photographs.",
    scrollContinue: "Scroll to explore"
  },

  divination: {
    intro: "Let me look into the crystal and see who Joel is.",
    instructions: "Choose an orb or use Tab/Enter to divine the past, present, and creative spirit.",
    crystals: [
      {
        id: "student",
        title: "The Student",
        subtitle: "Foundations & Academic Lore",
        lines: [
          "Shaped by foundational discipline at St. Joseph School, Bhopal till 2025.",
          "Pursuing BTech CSE in Artificial Intelligence and Machine Learning at NST Pune.",
          "Bridging foundational algorithmic rigor with exploratory modern engineering."
        ]
      },
      {
        id: "developer",
        title: "The Developer",
        subtitle: "Code Alchemist & Systems",
        lines: [
          "Commenced codecraft in 2022 with Python, forging logic into working reality.",
          "Constructed EDITH in 2023, an autonomous AI agent for personal workflow automation.",
          "Engineered low-level foundations in C/C++ in 2024, expanding into native Android app development in 2026."
        ]
      },
      {
        id: "creator",
        title: "The Creator",
        subtitle: "Light, Lenses & Soundscapes",
        lines: [
          "Preserving fleeting emotion through intentional natural-light photography.",
          "Crafting visual stories with rhythm in video cinematography and post-production.",
          "Expressing melodic harmony through vocal singing and music editing."
        ]
      }
    ]
  },

  timeline: {
    title: "The Grand Staircase",
    subtitle: "Chronicles of Knowledge & Milestones",
    milestones: [
      { year: "2022", title: "The First Spark", desc: "Started coding with Python, discovering the power of automated logic and syntax." },
      { year: "2023", title: "Birth of EDITH", desc: "Engineered EDITH, an AI agent capable of contextual assistance and task automation." },
      { year: "2024", title: "Low-Level Mastery", desc: "Completed Harvard's foundational coursework in C, expanding deeper into memory & C++." },
      { year: "2025", title: "Schooling Threshold", desc: "Concluded high school milestones at St. Joseph School, Bhopal." },
      { year: "2026", title: "NST Pune & Android Architecture", desc: "Enrolled in BTech CSE (AI/ML) at NST Pune; initiated native Android app engineering." }
    ]
  },

  skills: [
    {
      id: "python",
      name: "Python",
      subtitle: "Parseltongue",
      rune: "ᚦ",
      color: "#2ecc71",
      accent: "#1b4d3e",
      tagline: "I speak Python.",
      description: "My first language. I started in 2022, and in 2023 I built an AI agent called EDITH with it.",
      madeWith: "Autonomous AI Agent 'EDITH', Machine Learning algorithms, backend task automations."
    },
    {
      id: "cpp",
      name: "C++",
      subtitle: "The Wand Chooses the Wizard",
      rune: "ᚲ",
      color: "#e8b04a",
      accent: "#8b5a2b",
      tagline: "Fast, strict, powerful.",
      description: "I explored C++ in 2024. It taught me how computers really think.",
      madeWith: "Low-level system architectures, memory manipulation routines, performance-critical data models."
    },
    {
      id: "kotlin",
      name: "Kotlin",
      subtitle: "Owl Post",
      rune: "ᚱ",
      color: "#a36bf0",
      accent: "#5b2c9d",
      tagline: "Smooth, clean, and made for phones.",
      description: "I started Android app development in 2026 and use Kotlin with Jetpack Compose to build apps.",
      madeWith: "Jetpack Compose Components, a revision project where I tried every component."
    },
    {
      id: "android",
      name: "Android Studio",
      subtitle: "Room of Requirement",
      rune: "ᚨ",
      color: "#ff9f43",
      accent: "#b25910",
      tagline: "My workshop.",
      description: "This is where I design, build, and test my apps.",
      madeWith: "My Android apps and Jetpack Compose practice projects."
    },
    {
      id: "web",
      name: "HTML & CSS",
      subtitle: "Potions Class",
      rune: "ᚹ",
      color: "#ff5e7e",
      accent: "#00d2d3",
      tagline: "Structure and style, mixed.",
      description: "I mix HTML and CSS to make pages feel alive.",
      madeWith: "Nirman Project, my first vibe-coded website, and this portfolio."
    }
  ],

  projects: [
    {
      id: "nirman",
      name: "Nirman Project",
      tagline: "My first experiment with vibe coding, where I built a website with AI.",
      description: "Explored generative workflows and modern front-end mechanics to assemble an interactive aesthetic web canvas with fluid layouts.",
      tech: ["HTML", "CSS", "JavaScript", "AI Tools"],
      github: "https://github.com/StackDroidDev/Nirman_Project",
      demo: ""
    },
    {
      id: "compose",
      name: "Jetpack Compose Components",
      tagline: "A revision project where I tried every Jetpack Compose component.",
      description: "Comprehensive native Android repository implementing Material 3 primitives, adaptive states, lazy layouts, and gesture-driven animations.",
      tech: ["Kotlin", "Jetpack Compose", "Android Studio"],
      github: "https://github.com/StackDroidDev/Revision-of-JetPack-Compose",
      demo: ""
    },
    {
      id: "edith",
      name: "EDITH",
      tagline: "An AI agent I built in 2023 with Python.",
      description: "Contextual assistant constructed with automation scripts, natural language routines, and programmatic task triggers.",
      tech: ["Python", "AI", "Automation"],
      github: "",
      demo: ""
    }
  ],

  hackathons: [
    {
      id: "scratch",
      name: "Scratch Hackathon",
      built: "I made a ping pong ball game in Scratch.",
      goal: "My first hackathon: grasp coordinate geometry, collision detection, and user input within a strict time limit.",
      learned: "Game loop mechanics, event dispatchers, and the thrill of shipping under pressure.",
      status: "completed"
    },
    {
      id: "construct",
      name: "Construct Hackathon",
      partner: "Powered by Replit",
      built: "I am building a product using Replit.",
      goal: "Ship a scalable web application from scratch leveraging automated deployment environments.",
      learned: "Cloud execution environments, rapid API prototyping, and agile deployment cycles.",
      status: "in-progress"
    }
  ],

  trophies: [],

  resume: {
    title: "Curriculum Vitae",
    subtitle: "The Chronicled Scrolls of Joel Biju",
    summary: "Driven Android Software Engineer and Developer grounded in Native Kotlin, Compose Architecture, Machine Learning, and Low-Level Computing. Combining algorithmic craftsmanship with visual storytelling.",
    downloadBtnText: "Download Resume (PDF)"
  },

  contact: {
    title: "The Owlery",
    subtitle: "Send word across the midnight winds",
    namePlaceholder: "Your Name",
    emailPlaceholder: "Your Email Address",
    messagePlaceholder: "Inscribe your missive here (min 10 characters)...",
    sendButton: "Dispatch Owl",
    successMsg: "Your owl is on its way across the night sky.",
    errorMsg: "The owl could not take flight. Please check your message."
  },

  footer: {
    mischief: "Mischief Managed.",
    thanks: "Thanks for visiting.",
    backToTop: "Return to the platform",
    builtBy: "Built by Joel Biju"
  },

  rooms: [
    { id: 0, name: "The Platform", scroll: 0.0 },
    { id: 1, name: "Sorting Hat", scroll: 1.0 },
    { id: 2, name: "The Great Hall", scroll: 2.0 },
    { id: 3, name: "Divination Orbs", scroll: 3.0 },
    { id: 4, name: "Grand Staircase", scroll: 4.0 },
    { id: 5, name: "Skills Corridor", scroll: 9.0 },
    { id: 6, name: "Portrait Gallery", scroll: 13.5 },
    { id: 7, name: "Triwizard Arena", scroll: 17.0 },
    { id: 8, name: "The Scroll", scroll: 20.5 },
    { id: 9, name: "Owl Post", scroll: 21.8 },
    { id: 10, name: "Mischief Managed", scroll: 23.0 }
  ]
};

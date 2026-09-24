// Example question bank. The production version uses a larger, domain-tuned set;
// this trimmed version shows the data shape the app and its self-tests expect.

export const frictionGroups = [
  {
    id: "intake",
    title: "Intake / Lead Flow",
    triggerWords: ["leads", "intake", "follow-up", "missed calls"],
    coreQuestion: "Walk me through what happens from first contact to booked work.",
    points: [
      {
        id: "slow_response",
        label: "Slow response to new enquiries",
        questions: [
          "How quickly does someone respond when a new enquiry comes in?",
          "What happens after hours?",
        ],
      },
      {
        id: "missing_info",
        label: "Missing information at intake",
        questions: [
          "What information do you have to chase after the first contact?",
          "How does missing information delay the work?",
        ],
      },
    ],
  },
  {
    id: "coordination",
    title: "Coordination / Internal Operations",
    triggerWords: ["spreadsheets", "status", "handoffs", "scheduling"],
    coreQuestion: "Where does work most often get stuck waiting?",
    points: [
      {
        id: "status_chasing",
        label: "Chasing status updates",
        questions: [
          "How do people find out where a job stands today?",
          "Who usually knows the real status?",
        ],
      },
      {
        id: "duplicate_entry",
        label: "Entering the same data twice",
        questions: [
          "Which systems hold the same information?",
          "What mistakes happen because of re-entry?",
        ],
      },
    ],
  },
  {
    id: "reporting",
    title: "Reporting / Admin",
    triggerWords: ["reports", "invoices", "month-end", "copy-paste"],
    coreQuestion: "Which report or admin task takes longer than it should every week?",
    points: [
      {
        id: "manual_reporting",
        label: "Manual, copy-paste reporting",
        questions: [
          "How many systems does that report pull from?",
          "How often is the same report rebuilt?",
        ],
      },
    ],
  },
];

export const openingQuestions = [
  "What part of your week feels the most chaotic?",
  "What gets repeated that shouldn't need a person anymore?",
  "What feels more manual than it should?",
];

export const quantQuestions = [
  "How often does this happen?",
  "How much time does it take each week?",
  "How many people touch this process?",
  "What mistakes happen because of it?",
  "Does it affect revenue directly?",
];

export const closeScript =
  "This was really helpful. I'll turn these notes into a short assessment that ranks the biggest bottlenecks, estimates the time at stake, and suggests what to fix first.";

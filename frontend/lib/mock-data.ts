import type {
  Flashcard,
  Lecture,
  Quiz,
  QuizScorePoint,
  SubjectMasteryPoint,
  TutorMessage,
  WeeklyStudyPoint,
} from "@/types/study";

export const lecturesData: Lecture[] = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    subject: "Artificial Intelligence",
    duration: "42 min",
    status: "ready",
    sourceType: "pdf",
    uploadedAt: "2 days ago",
    summary:
      "Covers supervised vs. unsupervised learning, feature representation, train/validation/test splits, bias-variance tradeoff, and gradient descent optimization for linear and logistic models.",
    keyTakeaways: [
      "Supervised learning maps labeled inputs to predictions (classification and regression), whereas unsupervised learning discovers structure such as clusters or latent dimensions.",
      "Always evaluate generalization on unseen validation/test splits to prevent overfitting.",
      "High bias causes underfitting; high variance causes overfitting; regularization balances model complexity.",
      "Gradient descent iteratively updates weights opposite to the loss gradient scaled by the learning rate.",
    ],
    segments: [
      {
        id: "1-s1",
        label: "What Is Machine Learning?",
        reference: "00:00 · Slide 1–4",
        text: "Instead of hardcoding rules, machine learning algorithms learn parameters from historical data so predictions improve with experience.",
      },
      {
        id: "1-s2",
        label: "Supervised vs. Unsupervised Learning",
        reference: "11:30 · Slide 5–11",
        text: "Regression predicts continuous quantities like house prices, classification assigns discrete labels, and clustering groups unlabeled samples by similarity.",
      },
      {
        id: "1-s3",
        label: "Bias-Variance Tradeoff & Generalization",
        reference: "24:15 · Slide 12–18",
        text: "Splitting data into training, validation, and test sets keeps hyperparameter tuning from leaking test performance and helps spot overfitting early.",
      },
      {
        id: "1-s4",
        label: "Gradient Descent Optimization",
        reference: "33:40 · Slide 19–24",
        text: "Mini-batch gradient descent computes noisy gradient estimates on small batches, balancing convergence speed and memory usage.",
      },
    ],
    conceptNodes: [
      { id: "ml", label: "Machine Learning", x: 250, y: 20, kind: "root" },
      { id: "sup", label: "Supervised Learning", x: 70, y: 130, kind: "branch" },
      { id: "unsup", label: "Unsupervised Learning", x: 430, y: 130, kind: "branch" },
      { id: "reg", label: "Regression", x: 0, y: 250, kind: "leaf" },
      { id: "cls", label: "Classification", x: 145, y: 250, kind: "leaf" },
      { id: "clu", label: "Clustering (k-Means)", x: 430, y: 250, kind: "leaf" },
      { id: "eval", label: "Bias-Variance & Splits", x: 250, y: 340, kind: "branch" },
    ],
    conceptEdges: [
      { id: "e1", source: "ml", target: "sup", label: "labeled" },
      { id: "e2", source: "ml", target: "unsup", label: "unlabeled" },
      { id: "e3", source: "sup", target: "reg" },
      { id: "e4", source: "sup", target: "cls" },
      { id: "e5", source: "unsup", target: "clu" },
      { id: "e6", source: "sup", target: "eval", label: "validate" },
      { id: "e7", source: "unsup", target: "eval", label: "evaluate" },
    ],
    flashcardCount: 6,
    quizCount: 1,
  },
  {
    id: "2",
    title: "Operating Systems — Processes",
    subject: "Computer Science",
    duration: "36 min",
    status: "ready",
    sourceType: "audio",
    uploadedAt: "5 days ago",
    summary:
      "Explains process abstraction, Process Control Blocks (PCBs), the five-state process lifecycle, context switching overhead, and CPU scheduling tradeoffs across FCFS, SJF, and Round Robin.",
    keyTakeaways: [
      "A process is an active program in execution, owning an address space, registers, open file descriptors, and a Process Control Block (PCB).",
      "Processes transition between New, Ready, Running, Waiting (Blocked), and Terminated states.",
      "Context switching saves the outgoing PCB state and loads the incoming PCB state—pure overhead that should stay short.",
      "Round Robin prevents starvation with time quanta, whereas Shortest Job First minimizes average waiting time when burst times are known.",
    ],
    segments: [
      {
        id: "2-s1",
        label: "Program vs. Process",
        reference: "00:00 · 00:00–09:10",
        text: "A program is a passive binary on disk; a process is a live execution context managed by the kernel with isolated virtual memory.",
      },
      {
        id: "2-s2",
        label: "Process Control Block & States",
        reference: "09:10 · 09:10–21:00",
        text: "When a running process requests disk I/O, the OS moves it to the Waiting queue so another Ready process can utilize the CPU.",
      },
      {
        id: "2-s3",
        label: "Context Switching & Scheduling",
        reference: "21:00 · 21:00–36:00",
        text: "Choosing a Round Robin quantum too small increases context-switch overhead; too large degenerates into First-Come, First-Served.",
      },
    ],
    conceptNodes: [
      { id: "proc", label: "OS Process", x: 250, y: 20, kind: "root" },
      { id: "pcb", label: "Process Control Block", x: 60, y: 140, kind: "branch" },
      { id: "states", label: "5-State Lifecycle", x: 250, y: 140, kind: "branch" },
      { id: "sched", label: "CPU Scheduler", x: 440, y: 140, kind: "branch" },
      { id: "ctx", label: "Context Switch", x: 150, y: 265, kind: "leaf" },
      { id: "rr", label: "Round Robin Quantum", x: 440, y: 265, kind: "leaf" },
    ],
    conceptEdges: [
      { id: "os-e1", source: "proc", target: "pcb", label: "metadata" },
      { id: "os-e2", source: "proc", target: "states", label: "transitions" },
      { id: "os-e3", source: "proc", target: "sched", label: "dispatched by" },
      { id: "os-e4", source: "pcb", target: "ctx", label: "saved in" },
      { id: "os-e5", source: "states", target: "ctx" },
      { id: "os-e6", source: "sched", target: "rr", label: "preemptive" },
    ],
    flashcardCount: 4,
    quizCount: 1,
  },
  {
    id: "3",
    title: "Database Normalization",
    subject: "Database Systems",
    duration: "28 min",
    status: "ready",
    sourceType: "docx",
    uploadedAt: "1 week ago",
    summary:
      "Walks through update, insertion, and deletion anomalies and shows how 1NF, 2NF, 3NF, and BCNF decompose tables using functional dependencies without losing lossless-join properties.",
    keyTakeaways: [
      "Redundant storage causes insertion, update, and deletion anomalies in unnormalized tables.",
      "1NF enforces atomic attribute values and eliminates repeating groups.",
      "2NF removes partial dependencies on composite primary keys; 3NF removes transitive dependencies between non-key attributes.",
      "BCNF requires every non-trivial determinant to be a candidate superkey.",
    ],
    segments: [
      {
        id: "3-s1",
        label: "Data Anomalies",
        reference: "Page 1–2",
        text: "Storing department address inside every employee row risks inconsistent updates and loses department records when the last employee leaves.",
      },
      {
        id: "3-s2",
        label: "1NF & 2NF (Partial Dependencies)",
        reference: "Page 3–5",
        text: "If a composite key is (StudentID, CourseID) and StudentName depends only on StudentID, move StudentName to a Students table.",
      },
      {
        id: "3-s3",
        label: "3NF & BCNF",
        reference: "Page 6–8",
        text: "Transitive dependency A -> B -> C where B is non-key violates 3NF and should be split into (A, B) and (B, C).",
      },
    ],
    conceptNodes: [
      { id: "norm", label: "Normalization", x: 250, y: 20, kind: "root" },
      { id: "nf1", label: "1NF (Atomic Values)", x: 40, y: 140, kind: "branch" },
      { id: "nf2", label: "2NF (No Partial Dep.)", x: 250, y: 140, kind: "branch" },
      { id: "nf3", label: "3NF (No Transitive Dep.)", x: 460, y: 140, kind: "branch" },
      { id: "bcnf", label: "BCNF (Superkey Determinants)", x: 250, y: 265, kind: "leaf" },
    ],
    conceptEdges: [
      { id: "db-e1", source: "norm", target: "nf1" },
      { id: "db-e2", source: "nf1", target: "nf2" },
      { id: "db-e3", source: "nf2", target: "nf3" },
      { id: "db-e4", source: "nf3", target: "bcnf" },
    ],
    flashcardCount: 4,
    quizCount: 1,
  },
];

export const flashcardsData: Flashcard[] = [
  {
    id: "fc-1",
    lectureId: "1",
    lectureTitle: "Introduction to Machine Learning",
    subject: "Artificial Intelligence",
    front: "What is the key difference between supervised and unsupervised learning?",
    back: "Supervised learning trains on labeled input-output pairs (predicting known targets), while unsupervised learning finds patterns or clusters in unlabeled data.",
    hint: "Think about whether target answers exist in the training dataset.",
    mastery: "mastered",
    nextReviewLabel: "In 4 days",
  },
  {
    id: "fc-2",
    lectureId: "1",
    lectureTitle: "Introduction to Machine Learning",
    subject: "Artificial Intelligence",
    front: "What happens when a model has high variance?",
    back: "It overfits the training data—achieving very low training error while generalizing poorly to unseen validation or test examples.",
    hint: "Compare training accuracy vs. test accuracy.",
    mastery: "learning",
    nextReviewLabel: "Due today",
  },
  {
    id: "fc-3",
    lectureId: "1",
    lectureTitle: "Introduction to Machine Learning",
    subject: "Artificial Intelligence",
    front: "Why do we keep a separate test set untouched during hyperparameter tuning?",
    back: "To get an unbiased estimate of generalization performance; tuning repeatedly on the test set leaks information and overstates real-world accuracy.",
    mastery: "new",
    nextReviewLabel: "New card",
  },
  {
    id: "fc-4",
    lectureId: "2",
    lectureTitle: "Operating Systems — Processes",
    subject: "Computer Science",
    front: "What information does a Process Control Block (PCB) store?",
    back: "Process ID, current process state, program counter, CPU registers, memory-management pointers, scheduling priority, and open file descriptors.",
    hint: "Everything the kernel needs to pause and later resume a process.",
    mastery: "learning",
    nextReviewLabel: "Due today",
  },
  {
    id: "fc-5",
    lectureId: "2",
    lectureTitle: "Operating Systems — Processes",
    subject: "Computer Science",
    front: "What is the tradeoff of picking a tiny time quantum in Round Robin scheduling?",
    back: "Response time improves, but frequent context switches waste a large fraction of CPU cycles saving and restoring process state.",
    mastery: "new",
    nextReviewLabel: "New card",
  },
  {
    id: "fc-6",
    lectureId: "3",
    lectureTitle: "Database Normalization",
    subject: "Database Systems",
    front: "What dependency does Second Normal Form (2NF) eliminate?",
    back: "Partial functional dependencies—where a non-prime attribute depends on only part of a composite candidate key.",
    hint: "Applies specifically when keys have multiple columns.",
    mastery: "mastered",
    nextReviewLabel: "In 6 days",
  },
  {
    id: "fc-7",
    lectureId: "3",
    lectureTitle: "Database Normalization",
    subject: "Database Systems",
    front: "How does 3NF differ from 2NF?",
    back: "In addition to satisfying 2NF, 3NF removes transitive dependencies where a non-key attribute determines another non-key attribute.",
    mastery: "learning",
    nextReviewLabel: "Tomorrow",
  },
];

export const quizzesData: Quiz[] = [
  {
    id: "quiz-1",
    lectureId: "1",
    lectureTitle: "Introduction to Machine Learning",
    subject: "Artificial Intelligence",
    title: "ML Foundations & Generalization Check",
    difficulty: "Medium",
    estimatedMinutes: 5,
    questions: [
      {
        id: "q1-1",
        question:
          "A decision tree scores 99% on training data and 62% on validation data. Which issue is occurring?",
        options: [
          "High bias (underfitting)",
          "High variance (overfitting)",
          "Too large a learning rate",
          "Insufficient training epochs",
        ],
        correctIndex: 1,
        explanation:
          "A large gap between training performance (99%) and validation performance (62%) is the classic signature of high variance / overfitting.",
        sourceRef: "24:15 · Slide 12–18",
      },
      {
        id: "q1-2",
        question:
          "Which task is an example of unsupervised learning?",
        options: [
          "Predicting apartment rent from square footage",
          "Classifying emails as spam or not spam",
          "Grouping news articles by topic without predefined labels",
          "Forecasting tomorrow's peak temperature",
        ],
        correctIndex: 2,
        explanation:
          "Clustering unlabeled news articles discovers latent groupings without target labels, making it unsupervised learning.",
        sourceRef: "11:30 · Slide 5–11",
      },
      {
        id: "q1-3",
        question:
          "In gradient descent, how are model weights updated on each step?",
        options: [
          "In the same direction as the loss gradient",
          "In the opposite direction of the loss gradient scaled by the learning rate",
          "By setting weights equal to the validation error",
          "Only after testing all possible combinations of weights",
        ],
        correctIndex: 1,
        explanation:
          "Because the gradient points in the direction of steepest increase, subtracting learning_rate * gradient moves toward lower loss.",
        sourceRef: "33:40 · Slide 19–24",
      },
    ],
  },
  {
    id: "quiz-2",
    lectureId: "2",
    lectureTitle: "Operating Systems — Processes",
    subject: "Computer Science",
    title: "Process States & CPU Scheduling",
    difficulty: "Easy",
    estimatedMinutes: 4,
    questions: [
      {
        id: "q2-1",
        question:
          "When a running process issues a blocking disk read, which state does it move to?",
        options: ["Ready", "Waiting (Blocked)", "New", "Terminated"],
        correctIndex: 1,
        explanation:
          "A process waiting for an external I/O event enters the Waiting (Blocked) state until the I/O completes and moves it back to Ready.",
        sourceRef: "09:10 · 09:10–21:00",
      },
      {
        id: "q2-2",
        question:
          "What happens as the Round Robin time quantum becomes very large?",
        options: [
          "It behaves like First-Come, First-Served (FCFS)",
          "Context-switch overhead doubles",
          "Starvation becomes guaranteed",
          "Processes skip the Ready queue",
        ],
        correctIndex: 0,
        explanation:
          "If every process finishes its CPU burst within the large quantum, Round Robin effectively reduces to FCFS order.",
        sourceRef: "21:00 · 21:00–36:00",
      },
    ],
  },
  {
    id: "quiz-3",
    lectureId: "3",
    lectureTitle: "Database Normalization",
    subject: "Database Systems",
    title: "Normal Forms & Dependencies",
    difficulty: "Hard",
    estimatedMinutes: 6,
    questions: [
      {
        id: "q3-1",
        question:
          "In table Enrollment(StudentID, CourseID, StudentEmail), StudentEmail depends only on StudentID. Which normal form is violated?",
        options: ["1NF only", "2NF", "BCNF only", "None — it is fully normalized"],
        correctIndex: 1,
        explanation:
          "StudentEmail depends on only part of the composite key (StudentID, CourseID), creating a partial dependency that violates 2NF.",
        sourceRef: "Page 3–5",
      },
      {
        id: "q3-2",
        question:
          "Which condition defines Boyce-Codd Normal Form (BCNF)?",
        options: [
          "All columns contain atomic integers",
          "Every non-trivial functional dependency X -> Y has X as a superkey",
          "Tables may have at most three foreign keys",
          "No table may contain composite primary keys",
        ],
        correctIndex: 1,
        explanation:
          "BCNF strengthens 3NF by requiring every non-trivial determinant X in X -> Y to be a superkey.",
        sourceRef: "Page 6–8",
      },
    ],
  },
];

export const initialTutorMessages: TutorMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Hi! I'm your Lecture-to-Life AI Tutor. Pick a lecture scope on the left or ask me anything across your uploaded materials—I'll ground explanations in your lecture sections.",
    timestamp: "Just now",
    citations: [
      {
        lectureId: "1",
        lectureTitle: "Introduction to Machine Learning",
        reference: "Slide 12–18",
      },
    ],
  },
];

export const weeklyStudyData: WeeklyStudyPoint[] = [
  { day: "Mon", minutes: 35, cards: 18 },
  { day: "Tue", minutes: 50, cards: 26 },
  { day: "Wed", minutes: 25, cards: 14 },
  { day: "Thu", minutes: 65, cards: 32 },
  { day: "Fri", minutes: 45, cards: 22 },
  { day: "Sat", minutes: 80, cards: 40 },
  { day: "Sun", minutes: 55, cards: 34 },
];

export const quizScoreTrendData: QuizScorePoint[] = [
  { attempt: "Quiz 1", score: 72 },
  { attempt: "Quiz 2", score: 78 },
  { attempt: "Quiz 3", score: 81 },
  { attempt: "Quiz 4", score: 85 },
  { attempt: "Quiz 5", score: 88 },
  { attempt: "Quiz 6", score: 92 },
];

export const subjectMasteryData: SubjectMasteryPoint[] = [
  { subject: "Artificial Intelligence", mastery: 84, lectures: 5 },
  { subject: "Computer Science", mastery: 76, lectures: 4 },
  { subject: "Database Systems", mastery: 91, lectures: 3 },
];

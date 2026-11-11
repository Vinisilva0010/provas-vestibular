export type ExamTone = "sun" | "coral" | "violet" | "paper";

export type FeaturedExam = {
  slug: string;
  name: string;
  /** One plain sentence saying what the exam is. */
  summary: string;
  tone: ExamTone;
};

/** The seven exams that get a dedicated study plan. */
export const featuredExams: FeaturedExam[] = [
  { slug: "enem", name: "ENEM", summary: "Nota usada no SiSU, no ProUni e no FIES", tone: "sun" },
  { slug: "fuvest", name: "Fuvest", summary: "Vestibular da USP", tone: "coral" },
  { slug: "unicamp", name: "Unicamp", summary: "Vestibular da Unicamp", tone: "violet" },
  { slug: "unesp", name: "Unesp", summary: "Vestibular da Unesp", tone: "paper" },
  {
    slug: "uerj",
    name: "UERJ",
    summary: "Vestibular da Universidade do Estado do Rio de Janeiro",
    tone: "sun",
  },
  { slug: "ita-ime", name: "ITA / IME", summary: "Engenharia nas escolas militares", tone: "coral" },
  {
    slug: "ufrgs-ufpr",
    name: "UFRGS / UFPR",
    summary: "Vestibulares próprios das federais do Sul",
    tone: "violet",
  },
];

/** Every exam and program the site covers, used in the scrolling strip. */
export const coveredExamNames: string[] = [
  "ENEM",
  "Fuvest",
  "Unicamp",
  "Unesp",
  "UERJ",
  "ITA",
  "IME",
  "UFRGS",
  "UFPR",
  "SiSU",
  "ProUni",
  "FIES",
  "UFMG",
  "UFRJ",
  "UFSC",
  "UFPE",
  "UFBA",
  "UFG",
  "UFES",
  "UFSCar",
  "AFA",
  "Escola Naval",
  "EsPCEx",
  "Mackenzie",
  "PUC",
  "FGV",
  "Insper",
  "ESPM",
  "Fatec",
];

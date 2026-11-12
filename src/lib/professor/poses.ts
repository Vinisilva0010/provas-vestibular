export type ProfessorPose =
  | "point-right"
  | "point-left"
  | "sitting"
  | "angry"
  | "thinking"
  | "celebrating"
  | "calendar"
  | "reading"
  | "waving";

export type PoseConfig = {
  /** Portuguese description, shown in the development placeholder. */
  label: string;
  /** Public path of the PNG (transparent background). */
  src: string;
  /** Set to true once the PNG exists in public/professor/. */
  available: boolean;
};

const pose = (name: ProfessorPose, label: string): PoseConfig => ({
  label,
  src: `/professor/${name}.png`,
  available: true,
});

export const professorPoses: Record<ProfessorPose, PoseConfig> = {
  "point-right": pose("point-right", "apontando para a direita"),
  "point-left": pose("point-left", "apontando para a esquerda"),
  sitting: pose("sitting", "sentado"),
  angry: pose("angry", "cara de bravo"),
  thinking: pose("thinking", "pensando"),
  celebrating: pose("celebrating", "comemorando"),
  calendar: pose("calendar", "segurando o calendário"),
  reading: pose("reading", "lendo um livro"),
  waving: pose("waving", "acenando"),
};

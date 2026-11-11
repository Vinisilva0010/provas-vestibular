export type ProfessorPose = "point-right" | "point-left" | "sitting" | "angry";

export type PoseConfig = {
  /** Portuguese description, shown in the development placeholder. */
  label: string;
  /** Public path of the PNG (transparent background). */
  src: string;
  /** Set to true once the PNG exists in public/professor/. */
  available: boolean;
};

export const professorPoses: Record<ProfessorPose, PoseConfig> = {
  "point-right": {
    label: "apontando para a direita",
    src: "/professor/point-right.png",
    available: false,
  },
  "point-left": {
    label: "apontando para a esquerda",
    src: "/professor/point-left.png",
    available: false,
  },
  sitting: {
    label: "sentado",
    src: "/professor/sitting.png",
    available: false,
  },
  angry: {
    label: "cara de bravo",
    src: "/professor/angry.png",
    available: false,
  },
};

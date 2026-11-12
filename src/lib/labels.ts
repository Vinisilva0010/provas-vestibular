import type { Exam, ExamEvent, ExamStructure, officialDocumentKinds, regionCodes } from "./data/schemas";

type RegionCode = (typeof regionCodes)[number];
type DocumentKind = (typeof officialDocumentKinds)[number];
type PhaseFormat = ExamStructure["phases"][number]["format"];

const regionNames: Record<RegionCode, string> = {
  BR: "Todo o Brasil",
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

export function regionLabel(code: RegionCode): string {
  return regionNames[code];
}

export const eventStatusLabel: Record<ExamEvent["status"], string> = {
  official: "Oficial",
  announced: "Anunciado",
  "not-announced": "Ainda não divulgado",
};

export const examFormatLabel: Record<Exam["examFormat"], string> = {
  objective: "Múltipla escolha",
  essay: "Discursiva",
  mixed: "Múltipla escolha e discursiva",
};

export const phaseFormatLabel: Record<PhaseFormat, string> = {
  objective: "Múltipla escolha",
  essay: "Discursiva",
  mixed: "Múltipla escolha e discursiva",
  skills: "Prova específica",
};

export const documentKindLabel: Record<DocumentKind, string> = {
  notice: "Edital",
  "notice-amendment": "Retificação",
  guide: "Guia",
  syllabus: "Conteúdo cobrado",
  "exemption-rules": "Isenção de taxa",
  careers: "Cursos e vagas",
  accessibility: "Acessibilidade",
  "answer-key": "Gabarito",
  other: "Documento",
};

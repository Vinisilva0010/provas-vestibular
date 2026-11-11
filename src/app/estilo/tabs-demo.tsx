import { Tabs } from "@/components/ui/tabs";

export function TabsDemo() {
  return (
    <Tabs
      label="Seções da prova (exemplo)"
      items={[
        {
          id: "geral",
          label: "Informações gerais",
          content: <p>Nome oficial, instituição, tipo de prova e como funciona o processo.</p>,
        },
        {
          id: "calendario",
          label: "Calendário",
          content: <p>Inscrição, isenção, dias de prova, gabarito, resultado e matrícula.</p>,
        },
        {
          id: "estrutura",
          label: "Estrutura da prova",
          content: <p>Quantidade de questões, matérias, tempo de prova e cálculo da nota.</p>,
        },
        {
          id: "inscricao",
          label: "Inscrição",
          content: <p>Valor da taxa, documentos, regras de isenção e passo a passo.</p>,
        },
      ]}
    />
  );
}

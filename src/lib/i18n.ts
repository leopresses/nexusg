/**
 * Dicionário central pt-BR — traduz termos comuns e dias da semana do Google Places.
 */

const weekdayMap: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
  closed: "Fechado",
  open: "Aberto",
  "open 24 hours": "Aberto 24 horas",
};

/**
 * Traduz uma linha de horário do Google Places (ex.: "Monday: 9:00 AM – 5:00 PM")
 * para pt-BR (ex.: "Segunda-feira: 9:00 – 17:00").
 */
export function translateWeekdayLine(line: string): string {
  let translated = line;
  for (const [en, ptBr] of Object.entries(weekdayMap)) {
    const regex = new RegExp(`\\b${en}\\b`, "gi");
    translated = translated.replace(regex, ptBr);
  }
  // Converte AM/PM para 24h de forma simples
  translated = translated.replace(
    /(\d{1,2}):(\d{2})\s*(AM|PM)/gi,
    (_match, h, m, period) => {
      let hour = parseInt(h, 10);
      if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, "0")}:${m}`;
    }
  );
  return translated;
}

/**
 * Traduz um array inteiro de weekday_text do Google Places.
 */
export function translateWeekdayTexts(lines: string[]): string[] {
  return lines.map(translateWeekdayLine);
}

/** Dicionário geral de termos pt-BR */
const dictionary: Record<string, string> = {
  // Status
  loading: "Carregando…",
  error: "Erro",
  success: "Sucesso",
  warning: "Atenção",

  // Ações
  save: "Salvar",
  cancel: "Cancelar",
  delete: "Excluir",
  edit: "Editar",
  update: "Atualizar",
  back: "Voltar",
  next: "Próximo",
  confirm: "Confirmar",
  search: "Buscar",
  submit: "Enviar",
  close: "Fechar",
  open: "Abrir",
  create: "Criar",
  add: "Adicionar",
  remove: "Remover",
  filter: "Filtrar",
  export: "Exportar",
  import: "Importar",
  download: "Baixar",
  upload: "Enviar arquivo",
  refresh: "Atualizar",
  retry: "Tentar novamente",

  // Estados
  no_data: "Sem dados",
  empty: "Vazio",
  not_found: "Não encontrado",
  page_not_found: "Página não encontrada",

  // Navegação
  dashboard: "Painel Geral",
  clients: "Clientes",
  tasks: "Tarefas",
  reports: "Relatórios",
  
  audit: "Auditoria",
  settings: "Configurações",
  plans: "Planos",
  recovery: "Recuperação",

  // Auth
  sign_in: "Entrar",
  sign_up: "Criar conta",
  sign_out: "Sair",
  forgot_password: "Esqueceu a senha?",
  reset_password: "Redefinir senha",
  return_home: "Voltar ao início",
};

/**
 * Retorna a tradução pt-BR de uma chave. Se não encontrar, retorna a própria chave.
 */
export function t(key: string): string {
  return dictionary[key] ?? key;
}

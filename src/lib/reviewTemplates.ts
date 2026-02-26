export interface ReviewTemplate {
  label: string;
  ratingRange: [number, number];
  text: string;
}

export const reviewTemplates: ReviewTemplate[] = [
  {
    label: "5 estrelas – Agradecimento",
    ratingRange: [5, 5],
    text: `Olá, {nome}! 😊

Muito obrigado pela sua avaliação incrível! Ficamos felizes em saber que você teve uma ótima experiência com a {empresa}.

Será um prazer recebê-lo novamente. Até breve!

{assinatura}`,
  },
  {
    label: "4 estrelas – Agradecimento + Sugestão",
    ratingRange: [4, 4],
    text: `Olá, {nome}!

Obrigado pela sua avaliação! Ficamos felizes com o seu feedback positivo sobre a {empresa}.

Se houver algo que possamos melhorar, adoraríamos ouvir sua sugestão. Conte conosco!

{assinatura}`,
  },
  {
    label: "3 estrelas – Contato",
    ratingRange: [3, 3],
    text: `Olá, {nome},

Agradecemos por compartilhar sua experiência com a {empresa}. Seu feedback é muito importante para nós.

Gostaríamos de entender melhor como podemos melhorar. Podemos entrar em contato para conversar?

{assinatura}`,
  },
  {
    label: "1-2 estrelas – Resolução",
    ratingRange: [1, 2],
    text: `Olá, {nome},

Lamentamos que sua experiência com a {empresa} não tenha sido satisfatória. Pedimos desculpas por qualquer inconveniente.

Queremos muito resolver essa situação. Por favor, entre em contato conosco para que possamos ajudá-lo da melhor forma possível.

{assinatura}`,
  },
];

export function getTemplatesForRating(rating: number): ReviewTemplate[] {
  return reviewTemplates.filter(
    (t) => rating >= t.ratingRange[0] && rating <= t.ratingRange[1]
  );
}

export function fillTemplate(
  template: string,
  authorName: string,
  clientName: string,
  signature: string
): string {
  return template
    .replace(/\{nome\}/g, authorName || "Cliente")
    .replace(/\{empresa\}/g, clientName || "nossa empresa")
    .replace(/\{assinatura\}/g, signature || "Equipe Gestão Nexus");
}

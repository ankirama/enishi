import type { ScoreResult } from '@/lib/scoring/types';

export interface BuiltPrompt {
  system: string;
  user: string;
}

const SYSTEM = `Tu es un narrateur poétique français, à la manière d'un essayiste discret.
Tu écris en français soutenu, registre littéraire, sans cliché de site de rencontre, sans emoji, sans liste, sans titre.
Tu produis UN SEUL paragraphe fluide de 80 à 150 mots.
Ne mentionne ni "algorithme", ni "calcul", ni "pourcentage" — exprime la concordance par les images.
Si les noms sont identiques, joue avec l'idée du miroir, de la gémellité, sans tomber dans le narcissisme caricatural.`;

export function buildPrompt(result: ScoreResult): BuiltPrompt {
  const { inputs, percentage, tagline, subScores } = result;

  const user = `Deux prénoms : ${inputs.a} et ${inputs.b}.

Concordance globale : ${percentage}/100 (« ${tagline} »).

Décomposition :
- Résonance des lettres : ${subScores.resonance}/100
- Harmonie vocalique : ${subScores.harmony}/100
- Cadence : ${subScores.cadence}/100
- Empreinte numérologique : ${subScores.numerology}/100

Écris un seul paragraphe poétique en français qui raconte cette concordance.
Appuie-toi subtilement sur les sous-scores remarquables (les plus hauts comme les plus bas) pour donner du relief, sans jamais citer leurs noms ni leurs chiffres.
80 à 150 mots, un seul paragraphe.`;

  return { system: SYSTEM, user };
}

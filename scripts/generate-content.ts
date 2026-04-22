/**
 * Parses docs-source/Phases_de_jeunes.md and docs-source/Lexique.md
 * and generates validated content/phases.json and content/lexicon.json.
 *
 * Usage: npx tsx --tsconfig scripts/tsconfig.json scripts/generate-content.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { LexiconContentSchema, PhasesContentSchema } from '../lib/schemas/content';
import type { PhaseId } from '../lib/schemas/phase-reached';

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs-source');
const CONTENT = path.join(ROOT, 'content');

// --- Static data ---

const PHASE_MAP: { id: PhaseId; hours: number; title: string }[] = [
  { id: '12h', hours: 12, title: '12 heures de jeûne' },
  { id: '16h', hours: 16, title: '16 heures de jeûne' },
  { id: '18h', hours: 18, title: '18 heures de jeûne' },
  { id: '24h', hours: 24, title: '24 heures de jeûne' },
  { id: '36h', hours: 36, title: '36 heures de jeûne' },
  { id: '48h', hours: 48, title: '48 heures de jeûne' },
  { id: '56h', hours: 56, title: '56 heures de jeûne' },
  { id: '72h', hours: 72, title: '72 heures de jeûne' },
  { id: '96h', hours: 96, title: '96 heures de jeûne' },
];

// Derived from the "Phase de jeûne" bullets in Lexique.md; ranges like "à partir de Xh"
// are expanded to include all subsequent trigger points.
const LEXICON_ACTIVATION: Record<string, PhaseId[]> = {
  insuline: ['12h', '16h', '18h', '24h', '36h', '48h', '56h', '72h', '96h'],
  cetose: ['16h', '18h', '24h', '36h', '48h', '56h', '72h', '96h'],
  autophagie: ['18h', '24h', '36h', '48h', '56h', '72h', '96h'],
  'beta-hydroxybutyrate': ['18h', '24h', '36h', '48h', '56h', '72h', '96h'],
  glucagon: ['24h', '36h', '48h', '56h', '72h', '96h'],
  mtor: ['48h', '56h', '72h', '96h'],
  sirtuine: ['48h', '56h', '72h', '96h'],
  ampk: ['48h', '56h', '72h', '96h'],
  mitophagie: ['48h', '56h', '72h', '96h'],
  foxo: ['56h', '72h', '96h'],
  'igf-1': ['56h', '72h', '96h'],
};

// --- Parsing utilities ---

function escapeRe(s: string): string {
  return s.replace(/[$()*+.?[\\\]^{}|]/g, '\\$&');
}

function stripBold(text: string): string {
  return text.replace(/\*\*/g, '').trim();
}

/** Extracts the text block after a `**Header:**` until the next `**Uppercase` header. */
function extractSection(block: string, header: string): string {
  const lines = block.split('\n');
  const headerRe = new RegExp(`\\*\\*${escapeRe(header)}\\*\\*`);
  let inSection = false;
  const result: string[] = [];

  for (const line of lines) {
    if (headerRe.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      // Section headers start with ** followed by an uppercase letter
      if (/^\*\*[A-ZÀ-Ö]/.test(line.trim())) break;
      result.push(line);
    }
  }
  return result.join('\n').trim();
}

/** Parses `- plain text` bullets (strips bold markers). */
function parseRegularBullets(text: string): string[] {
  return text
    .split('\n')
    .filter((l) => /^-\s/.test(l.trim()))
    .map((l) => stripBold(l.trim().replace(/^-\s+/, '')))
    .filter(Boolean);
}

/** Parses `- **Name :** description` mechanism bullets. */
function parseMechanisms(text: string): { name: string; description: string }[] {
  return text
    .split('\n')
    .filter((l) => /^-\s+\*\*/.test(l.trim()))
    .map((l) => {
      const content = l.trim().replace(/^-\s+/, '');
      const match = content.match(/^\*\*(.+?)\s*:\*\*\s*(.*)/);
      if (!match) return null;
      return { name: stripBold(match[1] ?? ''), description: stripBold(match[2] ?? '') };
    })
    .filter((m): m is { name: string; description: string } => m !== null);
}

/** Converts a display name to a URL-safe slug. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// --- Phase parser ---

function parsePhases(markdown: string) {
  const phaseBlocks = markdown.split(/(?=\n## )/);

  return PHASE_MAP.map(({ id, hours, title }) => {
    const block = phaseBlocks.find((b) => b.includes(`${hours} heure`));
    if (!block) throw new Error(`Phase block not found for ${hours}h`);

    const whatHappens = parseRegularBullets(extractSection(block, 'Ce qui se passe :'));
    const mechanisms = parseMechanisms(extractSection(block, 'Mécanismes activés :'));
    const bodyBenefits = parseRegularBullets(extractSection(block, 'Bienfaits sur le corps :'));
    const mindBenefits = parseRegularBullets(
      extractSection(block, 'Bienfaits sur l\u2019esprit :')
    );
    const keyTerms = Object.entries(LEXICON_ACTIVATION)
      .filter(([, phases]) => phases.includes(id))
      .map(([termId]) => termId);

    return {
      id,
      triggerHours: hours,
      title,
      whatHappens,
      mechanisms,
      bodyBenefits,
      mindBenefits,
      keyTerms,
    };
  });
}

// --- Lexicon parser ---

function parseLexicon(markdown: string) {
  const termBlocks = markdown.split(/(?=\n### )/).filter((b) => /### \*\*/.test(b));

  return termBlocks.map((block) => {
    const nameMatch = block.match(/### \*\*(.+?)\*\*/);
    if (!nameMatch) throw new Error(`Could not parse term name: ${block.slice(0, 50)}`);
    const name = (nameMatch[1] ?? '').trim();
    const id = toSlug(name);

    const defSection = extractSection(block, 'Définition et rôle :');
    const impactSection = extractSection(block, 'Impact sur le corps et l\u2019esprit :');

    const definition = defSection
      .split('\n')
      .filter((l) => l.trim() && !/^[-•]/.test(l.trim()))
      .join(' ')
      .trim();

    let bodyImpact = '';
    let mindImpact = '';
    for (const line of impactSection.split('\n').filter((l) => /^-\s+\*\*/.test(l.trim()))) {
      const content = line.trim().replace(/^-\s+/, '');
      if (/^\*\*Corps\s*:/.test(content)) {
        bodyImpact = stripBold(content.replace(/^\*\*Corps\s*:\*\*\s*/, ''));
      } else if (/^\*\*Esprit\s*:/.test(content)) {
        mindImpact = stripBold(content.replace(/^\*\*Esprit\s*:\*\*\s*/, ''));
      }
    }

    const activationPhases = LEXICON_ACTIVATION[id] ?? [];

    return { id, name, definition, bodyImpact, mindImpact, activationPhases };
  });
}

// --- Main ---

function main(): void {
  fs.mkdirSync(CONTENT, { recursive: true });

  const phasesMarkdown = fs.readFileSync(path.join(DOCS, 'Phases_de_jeunes.md'), 'utf-8');
  const lexiqueMarkdown = fs.readFileSync(path.join(DOCS, 'Lexique.md'), 'utf-8');

  const phases = PhasesContentSchema.parse(parsePhases(phasesMarkdown));
  const lexicon = LexiconContentSchema.parse(parseLexicon(lexiqueMarkdown));

  fs.writeFileSync(path.join(CONTENT, 'phases.json'), JSON.stringify(phases, null, 2) + '\n');
  fs.writeFileSync(path.join(CONTENT, 'lexicon.json'), JSON.stringify(lexicon, null, 2) + '\n');

  process.stdout.write(`✓ phases.json — ${phases.length} phases\n`);
  process.stdout.write(`✓ lexicon.json — ${lexicon.length} entries\n`);
}

main();

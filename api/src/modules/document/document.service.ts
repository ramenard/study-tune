import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { MistralService } from './mistral.service';

const SUMMARY_PROMPT = `Tu es un assistant pédagogique. À partir du contenu de cours suivant, génère une fiche de révision structurée en français.
La fiche doit contenir :
- Un titre clair
- Les concepts clés sous forme de points concis
- Les définitions importantes
- Un résumé en 3-5 phrases

Contenu du cours :
`;

const LYRICS_PROMPT = `Tu es un auteur-compositeur créatif. À partir de cette fiche de cours, écris des paroles de chanson en français qui permettent de mémoriser les concepts importants.
Les paroles doivent :
- Être rythmées et mémorables
- Couvrir les concepts essentiels de la fiche
- Avoir un couplet, un refrain, et un second couplet
- Rester fidèles au contenu pédagogique

Contraintes de format strictes :
- La première ligne doit être uniquement : TITRE: <titre de la chanson>
- Ensuite les paroles brutes, sans commentaire, sans explication, sans analyse
- Conserver les balises de structure comme [Couplet 1], [Refrain], [Couplet 2], [Pont]
- Aucun emoji
- Aucun caractère de mise en forme (pas de *, **, _, #, ~)

Fiche de cours :
`;

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(private readonly mistral: MistralService) {}

  private extractTitleAndLyrics(raw: string): { title: string; lyrics: string } {
    const lines = raw.split('\n');
    const titleLine = lines[0] ?? '';
    const title = titleLine.startsWith('TITRE:') ? titleLine.replace('TITRE:', '').trim() : '';
    const lyrics = lines.slice(1).join('\n').trim();
    return { title, lyrics };
  }

  async processText(text: string): Promise<{ title: string; summary: string; lyrics: string }> {
    this.logger.log('Processing raw text');
    const summary = await this.mistral.generateText(SUMMARY_PROMPT + text);
    const raw = await this.mistral.generateText(LYRICS_PROMPT + summary);
    const { title, lyrics } = this.extractTitleAndLyrics(raw);
    return { title, summary, lyrics };
  }

  async processPdf(fileBuffer: Buffer): Promise<{ title: string; summary: string; lyrics: string }> {
    this.logger.log('Processing PDF');
    const parser = new PDFParse({ data: fileBuffer });
    const parsed = await parser.getText();
    return this.processText(parsed.text);
  }

  async process(text?: string, fileBuffer?: Buffer): Promise<{ title: string; summary: string; lyrics: string }> {
    if (fileBuffer) {
      return this.processPdf(fileBuffer);
    }

    if (!text) {
      throw new BadRequestException('Provide either a PDF file or a text content');
    }

    return this.processText(text);
  }
}
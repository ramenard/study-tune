import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { PDFParse } from 'pdf-parse';
import { MistralService } from './mistral.service';
import { ModerationService } from '../moderation/moderation.service';
import { StudySheet } from './entities/study-sheet.entity';

interface SheetContent {
  title: string;
  summary: string;
  lyrics: string;
}

export interface DocumentResult extends SheetContent {
  cached: boolean;
}

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

  constructor(
    private readonly mistral: MistralService,
    @InjectRepository(StudySheet)
    private readonly sheetRepo: Repository<StudySheet>,
    private readonly moderation: ModerationService,
  ) {}

  async process(
    userId: string,
    text?: string,
    fileBuffer?: Buffer,
  ): Promise<DocumentResult> {
    const source = await this.resolveSource(text, fileBuffer);
    const contentHash = createHash('sha256')
      .update(this.normalize(source))
      .digest('hex');

    const existing = await this.sheetRepo.findOne({
      where: { userId, contentHash },
    });

    if (existing) {
      this.logger.log('Study sheet cache hit — no AI call');
      return {
        title: existing.title,
        summary: existing.summary,
        lyrics: existing.lyrics,
        cached: true,
      };
    }

    const generated = await this.generate(source);
    await this.sheetRepo.save(
      this.sheetRepo.create({ userId, contentHash, ...generated }),
    );

    return { ...generated, cached: false };
  }

  private async resolveSource(
    text?: string,
    fileBuffer?: Buffer,
  ): Promise<string> {
    if (fileBuffer) {
      this.logger.log('Processing PDF');
      const parser = new PDFParse({ data: fileBuffer });
      const parsed = await parser.getText();
      return parsed.text;
    }

    if (!text) {
      throw new BadRequestException(
        'Provide either a PDF file or a text content',
      );
    }

    return text;
  }

  private async generate(source: string): Promise<SheetContent> {
    await this.moderation.assertClean(source);
    const summary = await this.mistral.generateText(SUMMARY_PROMPT + source);
    const raw = await this.mistral.generateText(LYRICS_PROMPT + summary);
    const { title, lyrics } = this.extractTitleAndLyrics(raw);
    return { title, summary, lyrics };
  }

  private normalize(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  private extractTitleAndLyrics(raw: string): {
    title: string;
    lyrics: string;
  } {
    const lines = raw.split('\n');
    const titleLine = lines[0] ?? '';
    const title = titleLine.startsWith('TITRE:')
      ? titleLine.replace('TITRE:', '').trim()
      : '';
    const lyrics = lines.slice(1).join('\n').trim();
    return { title, lyrics };
  }
}

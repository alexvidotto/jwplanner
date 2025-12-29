
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { startOfWeek, format, getYear, getISOWeek } from 'date-fns';

export interface DraftAssignment {
    parteTemplateId: string;
    tituloDoTema?: string;
    observacao?: string;
    tempo?: number;
}

@Injectable()
export class WolService {
    private readonly logger = new Logger(WolService.name);
    private readonly BASE_URL = 'https://wol.jw.org';

    async fetchWeekContent(date: string): Promise<DraftAssignment[]> {
        // 1. Calculate Week Start and Year/Month for search
        // We expect 'date' to be YYYY-MM-DD
        const targetDate = new Date(date);
        const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
        const year = getYear(weekStart);
        const month = targetDate.getMonth() + 1; // 1-12

        this.logger.log(`Fetching WOL content for week of ${format(weekStart, 'yyyy-MM-dd')}`);

        // 2. ID Calculation Strategy
        // Base Anchor: Week of November 17, 2025 -> ID 202025403
        // We assume IDs are consecutive.

        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        const baseDate = new Date('2025-11-17T00:00:00.000Z'); // Monday
        const baseId = 202025403;

        // Ensure we compare Mondays
        const targetMonday = startOfWeek(targetDate, { weekStartsOn: 1 });
        const baseMonday = startOfWeek(baseDate, { weekStartsOn: 1 });

        const diffWeeks = Math.round((targetMonday.getTime() - baseMonday.getTime()) / ONE_WEEK_MS);
        const predictedId = baseId + diffWeeks;

        let weekUrl = `${this.BASE_URL}/pt/wol/d/r5/lp-t/${predictedId}`;
        this.logger.log(`Calculated ID: ${predictedId} for date ${format(targetMonday, 'yyyy-MM-dd')} (Diff: ${diffWeeks} weeks)`);

        // 3. Scrape the week content
        const assignments: DraftAssignment[] = [];
        try {
            let weekHtml: string;
            try {
                const res = await axios.get(weekUrl);
                weekHtml = res.data;
            } catch (err: any) {
                if (err.response?.status === 404) {
                    this.logger.warn(`Calculated ID ${predictedId} failed (404). Trying fallback via Week Index...`);
                    const fallbackId = await this.getWeekIdFromWeekUrl(targetMonday);
                    if (fallbackId) {
                        this.logger.log(`Fallback ID found: ${fallbackId}`);
                        weekUrl = `${this.BASE_URL}/pt/wol/d/r5/lp-t/${fallbackId}`;
                        const res = await axios.get(weekUrl);
                        weekHtml = res.data;
                    } else {
                        throw err;
                    }
                } else {
                    throw err;
                }
            }
            const $ = cheerio.load(weekHtml);

            // Verify date in title to ensure accuracy
            const pageTitle = $('h1').first().text().trim();
            // Expected format: "17-23 de novembro" or similar
            // We can just log it for now. If strict validation is needed, we'd parse.
            this.logger.log(`Page Title: ${pageTitle}`);

            if (!pageTitle) {
                this.logger.warn('Page title empty, ID might be invalid or redirect page.');
                // If ID is wrong, WOL usually redirects to index or shows error.
                // We can check response URL if axios followed redirect.
            }
            const extractTextWithLinks = (elem: cheerio.Cheerio<any>): string => {
                // We want to preserve links as Markdown [text](url)
                // Clone to not destroy original
                const clone = $(elem).clone();
                clone.find('a').each((_, a) => {
                    const href = $(a).attr('href');
                    const text = $(a).text();
                    // Make absolute link
                    const fullHref = href?.startsWith('http') ? href : `${this.BASE_URL}${href}`;
                    $(a).replaceWith(`[${text}](${fullHref})`);
                });
                return clone.text().trim();
            };

            // SECTIONS
            // 1. TESOUROS
            // Look for "TESOUROS DA PALAVRA DE DEUS"
            // Usually headers or robust structure
            // structure: 
            // #section2 > .pGroup > ul > li
            // This structure is variable. Let's rely on specific classes or text search for headers.

            // Main sections usually have an H2 or similar.
            // "TESOUROS DA PALAVRA DE DEUS"
            // "FAÇA SEU MELHOR NO MINISTÉRIO"
            // "NOSSA VIDA CRISTÃ"

            // Let's traverse the main content: #publicationSection

            // Tesouros Talk (10 min)
            // Usually the first item after "TESOUROS..." header
            // It's often: "1. Title (10 min)..."
            // We map this to 'tpl_discurso'

            // Improved Scraping: Iterate H3s and check context
            // We'll iterate all elements in #publicationSection or main content to track headers.

            const mainContent = $('#publicationSection').length ? $('#publicationSection') : $('body');

            // Map known headers to sections
            let currentSection: 'TESOUROS' | 'FSM' | 'NVC' | null = null;

            // We iterate over all children of the main container(s) to track flow
            // Actually, querying H2s and H3s in order is safer.
            const allHeaders = mainContent.find('h2, h3').toArray();

            for (const header of allHeaders) {
                const $h = $(header);
                const text = $h.text().trim();
                const tagName = $h.prop('tagName').toLowerCase();

                // 1. Detect Section Change
                if (tagName === 'h2') {
                    if (text.includes('TESOUROS DA PALAVRA')) currentSection = 'TESOUROS';
                    else if (text.includes('FAÇA SEU MELHOR')) currentSection = 'FSM';
                    else if (text.includes('NOSSA VIDA CRISTÃ')) currentSection = 'NVC';
                    continue;
                }

                // 2. Process Parts (H3)
                if (tagName === 'h3' && currentSection) {
                    const titleRaw = text;
                    const nextContent = $h.nextUntil('h2, h3');

                    // CRITICAL FIX: Stop if we encounter a nested H2 (which indicates a section start wrapped in a div)
                    // nextUntil only checks siblings, but section headers like "NOSSA VIDA CRISTÃ" are often inside a div sibling.
                    const validElements: any[] = [];
                    nextContent.each((_, el) => {
                        if ($(el).find('h2').length > 0) return false; // Break loop
                        validElements.push(el);
                    });

                    let linksText = extractTextWithLinks($(validElements));

                    // Generic Time Extraction
                    let extractedTime: number | undefined;
                    const timeMatch = titleRaw.match(/\((\d+)\s*min\)/) || nextContent.text().match(/\((\d+)\s*min\)/);
                    if (timeMatch) {
                        extractedTime = parseInt(timeMatch[1], 10);
                    }

                    // TESOUROS SECTION
                    if (currentSection === 'TESOUROS') {
                        // Discurso
                        if (titleRaw.match(/^\d+\./) && !titleRaw.includes('Joias') && !titleRaw.includes('Leitura')) {
                            // Clean title
                            let theme = titleRaw.replace(/^\d+\.\s*/, '').replace(/\(.*\)/, '').trim();
                            if (theme.toLowerCase() === 'discurso') {
                                // Try to find theme in the body if title is just "Discurso"
                                const lines = linksText.split('\n');
                                if (lines.length > 0) {
                                    theme = lines[0];
                                    linksText = lines.slice(1).join('\n');
                                }
                            }
                            assignments.push({
                                parteTemplateId: 'tpl_discurso',
                                tituloDoTema: theme,
                                observacao: linksText,
                                tempo: extractedTime
                            });
                        }
                        else if (titleRaw.includes('Joias espirituais')) {
                            assignments.push({
                                parteTemplateId: 'tpl_joias',
                                observacao: linksText,
                                tempo: extractedTime
                            });
                        }
                        else if (titleRaw.includes('Leitura da Bíblia')) {
                            // Try to extract reading range from title if not in body
                            const match = titleRaw.match(/Leitura da Bíblia:?.*?\)\s*(.*)/);
                            if (match && match[1]) {
                                linksText = match[1] + (linksText ? '\n' + linksText : '');
                            }
                            assignments.push({
                                parteTemplateId: 'tpl_leitura',
                                observacao: linksText,
                                tempo: extractedTime
                            });
                        }
                    }

                    // FSM SECTION
                    else if (currentSection === 'FSM') {
                        if (titleRaw.includes('Iniciando conversas')) {
                            assignments.push({
                                parteTemplateId: 'tpl_iniciando',
                                tituloDoTema: 'Iniciando Conversas',
                                observacao: linksText,
                                tempo: extractedTime
                            });
                        } else if (titleRaw.includes('Cultivando o interesse')) {
                            assignments.push({
                                parteTemplateId: 'tpl_cultivando',
                                tituloDoTema: 'Cultivando o Interesse',
                                observacao: linksText,
                                tempo: extractedTime
                            });
                        } else if (titleRaw.includes('Fazendo discípulos')) {
                            assignments.push({
                                parteTemplateId: 'tpl_fazendo',
                                tituloDoTema: 'Fazendo Discípulos',
                                observacao: linksText,
                                tempo: extractedTime
                            });
                        } else if (titleRaw.includes('Explique suas crenças') || titleRaw.includes('Explicando suas crenças')) {
                            assignments.push({
                                parteTemplateId: 'tpl_crencas',
                                tituloDoTema: titleRaw.replace(/^\d+\.\s*/, '').replace(/\(.*\)/, '').trim(),
                                observacao: linksText,
                                tempo: extractedTime
                            });
                        } else if (titleRaw.includes('Discurso')) {
                            assignments.push({
                                parteTemplateId: 'tpl_discurso_fsm',
                                tituloDoTema: titleRaw.replace(/^\d+\.\s*/, '').replace(/\(.*\)/, '').trim(),
                                observacao: linksText,
                                tempo: extractedTime
                            });
                        } else {
                            this.logger.debug(`Unhandled FSM Part: ${titleRaw}`);
                        }
                    }

                    // NVC SECTION
                    else if (currentSection === 'NVC') {
                        this.logger.debug(`Processing NVC Part: ${titleRaw}`);
                        if (titleRaw.includes('Estudo bíblico de congregação')) {
                            const match = titleRaw.match(/Estudo bíblico de congregação:?.*?\)\s*(.*)/);
                            if (match && match[1]) {
                                linksText = match[1] + (linksText ? '\n' + linksText : '');
                            }
                            assignments.push({ parteTemplateId: 'tpl_estudo', observacao: linksText });
                        }
                        else if (
                            titleRaw.includes('Necessidades locais') ||
                            (extractedTime && !titleRaw.includes('Estudo') && !titleRaw.includes('Cântico') && !titleRaw.toLowerCase().includes('oração'))
                        ) {
                            assignments.push({
                                parteTemplateId: 'tpl_necessidades',
                                tituloDoTema: titleRaw.replace(/^\d+\.\s*/, '').replace(/\(.*\)/, '').trim(),
                                observacao: linksText,
                                tempo: extractedTime
                            });
                        }
                        // Closing Prayer / Final Comments
                        else if (titleRaw.toLowerCase().includes('oração') || titleRaw.toLowerCase().includes('comentários finais')) {
                            assignments.push({
                                parteTemplateId: 'tpl_oracao',
                                tituloDoTema: 'Oração Final',
                                observacao: ''
                            });
                        }
                    }
                }
            }

            // 3. Post-Process: Closing Prayer
            // Sometimes "Cântico ... e oração" is not a header, just the last paragraph.
            // We search for it in the NVC section if we haven't found it.
            const nvcHeader = allHeaders.find(h => $(h).text().toUpperCase().includes('NOSSA VIDA CRISTÃ'));
            if (nvcHeader) {
                const nvcContent = $(nvcHeader).nextUntil('h2'); // Get all NVC content
                const prayerText = nvcContent.text();
                // Check if likely a normal meeting with prayer
                if (prayerText.toLowerCase().includes('oração') && !assignments.some(a => a.parteTemplateId === 'tpl_oracao')) {
                    // Try to find the specific line for Song/Prayer
                    // usually "Cântico 151 e oração"
                    // We can try to extract the song number for observation?
                    // For now, just ensuring it exists is enough to prevent deletion.
                    assignments.push({
                        parteTemplateId: 'tpl_oracao',
                        tituloDoTema: 'Oração Final',
                        observacao: ''
                    });
                }
            }

        } catch (e) {
            this.logger.error(`Error scraping week: ${e.message}`);
            throw e;
        }

        return assignments;
    }

    private async getWeekIdFromWeekUrl(date: Date): Promise<number | null> {
        const year = getYear(date);
        const week = getISOWeek(date);
        // User pointed out: meetings/r5/lp-t/{year}/{week}
        const url = `${this.BASE_URL}/pt/wol/meetings/r5/lp-t/${year}/${week}`;
        this.logger.log(`Fetching Week Index for ID lookup: ${url}`);

        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            // Look for the "Apostila Vida e Ministério" link
            const link = $('a').filter((_, el) => {
                const href = $(el).attr('href') || '';
                const text = $(el).text();
                return href.includes('/d/r5/lp-t/') && (text.includes('Vida e Ministério') || text.includes('Apostila'));
            }).first().attr('href');

            if (link) {
                const match = link.match(/\/d\/r5\/lp-t\/(\d+)/);
                if (match) return parseInt(match[1], 10);
            }
        } catch (e: any) {
            this.logger.warn(`Week Index lookup failed: ${e.message}`);
        }
        return null;
    }
}

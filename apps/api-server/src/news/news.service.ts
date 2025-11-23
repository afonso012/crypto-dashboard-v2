import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  
  // Cache em memória para não estourar o limite da API
  private newsCache: any[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  async getLatestNews() {
    const now = Date.now();

    // Se a cache for válida (menos de 5 min), retorna o que já temos
    if (this.newsCache.length > 0 && (now - this.lastFetchTime < this.CACHE_TTL)) {
      return this.newsCache;
    }

    this.logger.log('A buscar notícias frescas à CryptoCompare...');

    try {
      // API Pública da CryptoCompare (Gratuita e sem chave para endpoints básicos)
      const response = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
      
      if (!response.ok) {
        throw new Error(`Erro API: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Mapeamento para limpar o lixo que vem da API
      this.newsCache = data.Data.map((item: any) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        imageurl: item.imageurl,
        url: item.url,
        source: item.source_info.name,
        published_on: item.published_on,
        tags: item.tags ? item.tags.split('|') : []
      }));

      this.lastFetchTime = now;
      return this.newsCache;
    } catch (error) {
      this.logger.error('Falha ao buscar notícias', error);
      // Em caso de erro, tenta devolver a cache antiga se existir
      return this.newsCache; 
    }
  }
}
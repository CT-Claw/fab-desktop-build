export type LocalMarketKind = 'skills' | 'mcp' | 'models' | 'providers';

export interface LocalMarketItem {
  author: string;
  category?: string;
  description: string;
  homepage?: string;
  id: string;
  installable: boolean;
  name: string;
  score?: number;
  source: 'fab' | 'quality' | 'runtime';
  stars?: number;
}

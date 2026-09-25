'use client';

import { Button } from '@lobehub/ui';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';

import { fabSkillItems, localMcpItems, localModelItems, localProviderItems } from './catalog';
import { fetchQualityManifest } from './marketManifest';
import { styles } from './style';
import { type LocalMarketItem } from './types';
import { type LocalMarketKind } from './types';

const titles: Record<LocalMarketKind, string> = {
  mcp: '本地 MCP 市场',
  models: '本地模型市场',
  providers: '本地模型供应商市场',
  skills: '本地技能市场',
};

const localItems: Record<LocalMarketKind, LocalMarketItem[]> = {
  mcp: localMcpItems,
  models: localModelItems,
  providers: localProviderItems,
  skills: fabSkillItems,
};

const LocalMarketCatalog = ({ kind }: { kind: LocalMarketKind }) => {
  const navigate = useWorkspaceAwareNavigate();
  const { t } = useTranslation('discover');
  const [qualityItems, setQualityItems] = useState<LocalMarketItem[]>([]);
  const [loading, setLoading] = useState(kind === 'skills' || kind === 'mcp');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (kind !== 'skills' && kind !== 'mcp') {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);
    void fetchQualityManifest(kind, controller.signal)
      .then(setQualityItems)
      .catch((reason: unknown) => {
        if ((reason as { name?: string })?.name !== 'AbortError') setError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [kind]);

  const items = useMemo(() => [...localItems[kind], ...qualityItems], [kind, qualityItems]);

  return (
    <main className={styles.page} data-testid={`local-market-${kind}`}>
      <div className={styles.header}>
        <div>
          <Button icon={ArrowLeft} size="small" type="text" onClick={() => navigate('/community')}>
            返回本地市场
          </Button>
          <h1>{titles[kind]}</h1>
          <div className={styles.meta}>
            Fab 本地能力、每日同步的精选清单和当前运行时目录分开展示。
          </div>
        </div>
        {(kind === 'skills' || kind === 'mcp') && (
          <span className={styles.meta}>{loading ? '正在读取本地精选清单…' : '每日同步清单'}</span>
        )}
      </div>

      {error && <p role="status">精选清单暂时不可用，仍显示已内置的 Fab 能力。</p>}
      <div className={styles.cardGrid}>
        {items.map((item) => (
          <article className={styles.card} key={`${item.source}:${item.id}`}>
            <span className={styles.tag}>{item.source === 'fab' ? 'FAB 专用' : item.source === 'quality' ? '本地精选' : '运行时'}</span>
            <h2 className={styles.title}>{item.name}</h2>
            <p className={styles.description}>{item.description}</p>
            <div className={styles.meta}>
              {item.author}
              {item.category ? ` · ${item.category}` : ''}
              {item.stars !== undefined ? ` · ★ ${item.stars.toLocaleString()}` : ''}
              {item.score !== undefined ? ` · 评分 ${item.score.toFixed(2)}` : ''}
            </div>
            {item.homepage ? (
              <a href={item.homepage} rel="noreferrer" target="_blank">
                <Button icon={ExternalLink} size="small" type="text">
                  查看来源
                </Button>
              </a>
            ) : (
              <Button disabled={!item.installable} size="small">
                {item.installable ? '已内置，可在助手档案启用' : '仅精选目录，离线包待核验'}
              </Button>
            )}
          </article>
        ))}
      </div>
      <p className={styles.meta}>
        {t('localMarket.qualityNotice', {
          defaultValue:
            '精选清单的星标/评分是同步快照，不代表当前 Fab 已安装或已验证该第三方能力。',
        })}
      </p>
    </main>
  );
};

export default LocalMarketCatalog;

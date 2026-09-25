'use client';

import { ActionIcon, Avatar, Button, Input } from '@lobehub/ui';
import { ArrowLeft, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router';

import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import WorkspaceLink from '@/features/Workspace/WorkspaceLink';
import { useAgentStore } from '@/store/agent';
import { useHomeStore } from '@/store/home';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import {
  filterLocalAssistants,
  localAssistants,
  localBrands,
  localDomains,
  localRoleCategories,
} from './catalog';
import OfficialCommunity from './OfficialCommunity';
import { installLocalAssistant } from './install';
import { styles } from './style';

const LocalAssistantMarket = ({
  embedded = false,
  initialDomain = '',
  limit,
  onInstalled,
  onBrowse,
}: {
  embedded?: boolean;
  initialDomain?: string;
  limit?: number;
  onInstalled?: (agentId: string) => void | Promise<void>;
  onBrowse?: () => void;
}) => {
  const { t } = useTranslation('discover');
  const navigate = useWorkspaceAwareNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [domain, setDomain] = useState(initialDomain);
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState(false);
  const busy = useRef(false);
  const userId = useUserStore(userProfileSelectors.userId);
  const refreshAgentList = useHomeStore((s) => s.refreshAgentList);
  const invalidateAvailableAgents = useAgentStore((s) => s.invalidateAvailableAgents);
  const selected = pathname.match(/\/community\/agent\/([^/]+)\/?$/)?.[1];
  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const matches = filterLocalAssistants(query, domain, category, brand).filter(
      (entry) => !selected || entry.identifier === selected,
    );
    return limit && !needle && !domain && !category && !brand ? matches.slice(0, limit) : matches;
  }, [query, selected, limit, domain, category, brand]);

  const install = async (identifier: string) => {
    if (busy.current) return;
    if (!userId) {
      navigate('/signin', { escape: true });
      return;
    }
    busy.current = true;
    setPending(identifier);
    setError(false);
    try {
      const { agentId } = await installLocalAssistant(identifier, userId);
      invalidateAvailableAgents();
      void refreshAgentList().catch(() => undefined);
      if (onInstalled) await onInstalled(agentId);
      else navigate(`/agent/${encodeURIComponent(agentId)}`);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setPending(undefined);
    }
  };

  return (
    <main
      className={styles.page}
      data-testid={embedded ? 'local-assistant-recommendations' : 'local-assistant-catalog'}
      data-catalog-count={localAssistants.length}
    >
      {!embedded && (
        <header className={styles.header}>
          <ActionIcon
            icon={ArrowLeft}
            title={t('localMarket.back')}
            onClick={() => navigate('/')}
          />
          <h1>{t('localMarket.title')}</h1>
        </header>
      )}
      <nav aria-label={t('localMarket.title')} className={styles.tabs}>
        <WorkspaceLink aria-current="page" to="/community/agent" onClick={onBrowse}>
          {t('localMarket.local')} ({localAssistants.length})
        </WorkspaceLink>
        {embedded && (
          <Button
            data-testid="local-assistant-switch"
            onClick={() => {
              onBrowse?.();
              navigate('/community/agent');
            }}
          >
            {t('switch', { ns: 'common' })}
          </Button>
        )}
        {!embedded && <OfficialCommunity />}
      </nav>
      <Input
        aria-label={t('localMarket.search')}
        placeholder={t('localMarket.search')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className={styles.filters}>
        <select
          aria-label={t('localMarket.domain')}
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
        >
          <option value="">{t('localMarket.domain')}</option>
          {localDomains.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id} {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t('localMarket.category')}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">{t('localMarket.category')}</option>
          {localRoleCategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label={t('localMarket.brand')}
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
        >
          <option value="">{t('localMarket.brand')}</option>
          {localBrands.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <p className={styles.meta}>{t('localMarket.dependencies')}</p>
      {error && <p role="alert">{t('localMarket.installError')}</p>}
      {items.length === 0 && <p role="status">{t('localMarket.empty')}</p>}
      <div className={styles.grid}>
        {items.map((entry) => (
          <article
            className={styles.card}
            key={entry.identifier}
            data-assistant-id={entry.identifier}
          >
            <Avatar avatar={entry.meta.avatar} shape="square" size={36} />
            <h2>{entry.meta.title}</h2>
            <p>{entry.meta.description}</p>
            <p className={styles.meta}>{entry.meta.tags.join(' / ')}</p>
            {entry.config.plugins.length > 0 && (
              <p role="status">
                {t('localMarket.disabledTools', { names: entry.config.plugins.join(', ') })}
              </p>
            )}
            <details open={selected === entry.identifier}>
              <summary>{t('localMarket.prompt')}</summary>
              <pre>{entry.config.systemRole}</pre>
              <p>{entry.config.openingMessage}</p>
              <ul>
                {entry.config.openingQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </details>
            <Button
              data-testid="local-assistant-install"
              disabled={Boolean(pending)}
              icon={Plus}
              loading={pending === entry.identifier}
              onClick={() => void install(entry.identifier)}
            >
              {t(userId ? 'localMarket.install' : 'localMarket.signIn')}
            </Button>
          </article>
        ))}
      </div>
    </main>
  );
};

export default LocalAssistantMarket;

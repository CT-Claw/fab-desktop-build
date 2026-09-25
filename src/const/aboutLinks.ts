import { CHITUO_PUBLIC_LINKS } from '@/const/chituoLinks';

export type AboutLinkId =
  | 'officialSite'
  | 'support'
  | 'business'
  | 'blog'
  | 'github'
  | 'discord'
  | 'x'
  | 'youtube'
  | 'downloads'
  | 'industryResources'
  | 'insights'
  | 'terms'
  | 'privacy';

export type AboutLinkItem = {
  id: AboutLinkId;
  label: string;
  url: string;
};

export type AboutLinksConfig = {
  contact: AboutLinkItem[];
  information: AboutLinkItem[];
  legal: AboutLinkItem[];
};

export type AboutPageConfig = {
  changelogLabel: string;
  changelogUrl: string;
  logoLinkUrl: string;
};

export const DEFAULT_ABOUT_LINKS: AboutLinksConfig = {
  contact: [
    { id: 'officialSite', label: '官方网站', url: CHITUO_PUBLIC_LINKS.website },
    { id: 'support', label: '邮件支持', url: CHITUO_PUBLIC_LINKS.support },
    { id: 'business', label: '商务合作', url: CHITUO_PUBLIC_LINKS.support },
  ],
  information: [
    { id: 'downloads', label: '客户端下载', url: CHITUO_PUBLIC_LINKS.downloads },
    { id: 'insights', label: '行业洞察', url: CHITUO_PUBLIC_LINKS.insights },
    {
      id: 'industryResources',
      label: '行业资源',
      url: CHITUO_PUBLIC_LINKS.industryResources,
    },
  ],
  legal: [],
};

export const DEFAULT_ABOUT_PAGE_CONFIG: AboutPageConfig = {
  changelogLabel: '客户端下载',
  changelogUrl: CHITUO_PUBLIC_LINKS.downloads,
  logoLinkUrl: CHITUO_PUBLIC_LINKS.website,
};

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const aboutLinkIds = new Set<AboutLinkId>([
  'officialSite',
  'support',
  'business',
  'blog',
  'github',
  'discord',
  'x',
  'youtube',
  'downloads',
  'industryResources',
  'insights',
  'terms',
  'privacy',
]);

const legacyOrPlaceholderLinks = new Set([
  'https://discord.gg',
  'https://gdibao.com/blog',
  'https://gdibao.com/privacy',
  'https://gdibao.com/terms',
  'https://github.com/CT-Claw',
  'https://www.youtube.com/@ct-claw',
  'https://x.com',
]);

const isUsableAboutUrl = (value: string) => {
  if (!value || legacyOrPlaceholderLinks.has(value.replace(/\/$/, ''))) return false;
  if (value.startsWith('mailto:')) return value.length > 'mailto:'.length;

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return (
      ['http:', 'https:'].includes(parsed.protocol) &&
      hostname !== 'chat.qingyouai.com' &&
      hostname !== 'lobehub.com' &&
      !hostname.endsWith('.lobehub.com')
    );
  } catch {
    return false;
  }
};

const normalizeGroup = (value: unknown, defaults: AboutLinkItem[]): AboutLinkItem[] => {
  const items = Array.isArray(value)
    ? value.filter((item): item is Partial<AboutLinkItem> => !!item && typeof item === 'object')
    : [];
  const defaultsById = new Map(defaults.map((item) => [item.id, item]));
  const ids = [
    ...defaults.map((item) => item.id),
    ...items
      .map((item) => item.id)
      .filter((id): id is AboutLinkId => !!id && aboutLinkIds.has(id)),
  ].filter((id, index, all) => all.indexOf(id) === index);

  return ids.flatMap((id) => {
    const fallback = defaultsById.get(id);
    const matched = items.find((item) => item.id === id);
    const label = normalizeText(matched?.label);
    const url = normalizeText(matched?.url);

    if (url && isUsableAboutUrl(url)) {
      return [{ id, label: label || fallback?.label || id, url }];
    }
    return fallback ? [fallback] : [];
  });
};

export const normalizeAboutLinksConfig = (value: unknown): AboutLinksConfig => {
  const config = value && typeof value === 'object' ? (value as Partial<AboutLinksConfig>) : {};

  return {
    contact: normalizeGroup(config.contact, DEFAULT_ABOUT_LINKS.contact),
    information: normalizeGroup(config.information, DEFAULT_ABOUT_LINKS.information),
    legal: normalizeGroup(config.legal, DEFAULT_ABOUT_LINKS.legal),
  };
};

export const normalizeAboutPageConfig = (value: unknown): AboutPageConfig => {
  const config =
    value && typeof value === 'object'
      ? (value as Partial<Record<keyof AboutPageConfig, unknown>>)
      : {};
  const changelogLabel = normalizeText(config.changelogLabel);
  const changelogUrl = normalizeText(config.changelogUrl);
  const logoLinkUrl = normalizeText(config.logoLinkUrl);

  const normalizePublicUrl = (url: string, fallback: string) => {
    if (!url) return fallback;

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      if (!['http:', 'https:'].includes(parsed.protocol)) return fallback;
      if (
        hostname === 'gdibao.comchangelog' ||
        hostname === 'chat.qingyouai.com' ||
        hostname === 'lobehub.com' ||
        hostname.endsWith('.lobehub.com')
      ) {
        return fallback;
      }
      return url;
    } catch {
      return fallback;
    }
  };

  return {
    changelogLabel: changelogLabel || DEFAULT_ABOUT_PAGE_CONFIG.changelogLabel,
    changelogUrl: normalizePublicUrl(changelogUrl, DEFAULT_ABOUT_PAGE_CONFIG.changelogUrl),
    logoLinkUrl: normalizePublicUrl(logoLinkUrl, DEFAULT_ABOUT_PAGE_CONFIG.logoLinkUrl),
  };
};

'use client';

import { useAnalytics } from '@lobehub/analytics/react';
import { type MenuProps } from '@lobehub/ui';
import { ActionIcon, DropdownMenu, Flexbox, Icon } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import {
  CircleHelp,
  Crown,
  Download,
  FlaskConical,
  Globe2,
  Mail,
  Send,
  Settings2,
  SettingsIcon,
  Sparkles,
} from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import { useHasActiveWorkspace } from '@/business/client/hooks/useHasActiveWorkspace';
import { openChangelogModal } from '@/components/ChangelogModal';
import { openFeedbackModal } from '@/components/FeedbackModal';
import { PUBLIC_HELP_MENU_SWR_KEY } from '@/const/adminCacheKeys';
import { CHITUO_PUBLIC_LINKS } from '@/const/chituoLinks';
import Billboard from '@/features/Billboard';
import { useBillboardMenuItems } from '@/features/Billboard/MenuItems';
import { useBrand } from '@/features/Brand';
import { useActiveNavKey } from '@/features/NavPanel/useActiveNavKey';
import { buildCustomHelpMenuItems } from '@/features/User/helpMenuItems';
import ThemeButton from '@/features/User/UserPanel/ThemeButton';
import WorkspaceLink from '@/features/Workspace/WorkspaceLink';
import { useNavLayout } from '@/hooks/useNavLayout';
import { adminCommercialService } from '@/services/adminCommercial';
import { serverConfigSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import { createConfiguredHelpMenuItems } from './helpMenuItems';

const styles = createStaticStyles(({ css, cssVar }) => ({
  memberCard: css`
    isolation: isolate;
    position: relative;

    overflow: hidden;

    margin-block-end: 4px;
    padding: 10px;
    border-radius: 8px;

    background: ${cssVar.colorFillQuaternary};
    box-shadow: 0 6px 18px ${cssVar.colorWarningBg};

    transition:
      transform 160ms ease,
      background 160ms ease;

    &::after {
      pointer-events: none;
      content: '';

      position: absolute;
      z-index: 0;
      inset: 0;
      transform: translate3d(-130%, 0, 0);

      background: linear-gradient(
        105deg,
        transparent 35%,
        rgb(255 255 255 / 22%) 50%,
        transparent 65%
      );
    }

    & > * {
      position: relative;
      z-index: 1;
    }

    &:hover {
      transform: translateY(-1px);
      background: ${cssVar.colorFillTertiary};
    }

    @media (prefers-reduced-motion: no-preference) {
      &::after {
        animation: member-shine 8s ease-in-out infinite;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;

      &:hover {
        transform: none;
      }
    }

    @keyframes member-shine {
      0%,
      72% {
        transform: translate3d(-130%, 0, 0);
      }

      88%,
      100% {
        transform: translate3d(130%, 0, 0);
      }
    }
  `,
  memberDescription: css`
    font-size: 12px;
    line-height: 1.45;
    color: ${cssVar.colorTextDescription};
  `,
  memberIcon: css`
    color: ${cssVar.colorWarning};
    filter: drop-shadow(0 2px 4px ${cssVar.colorWarningBg});
  `,
  memberLink: css`
    display: block;
    padding-inline: 8px;
    color: inherit;
    text-decoration: none;
  `,
  memberSparkle: css`
    margin-inline-start: auto;
    color: ${cssVar.colorWarning};
    opacity: 0.72;
  `,
  memberTitle: css`
    font-size: 13px;
    line-height: 1.3;
  `,
}));

type FooterMenuItems = NonNullable<MenuProps['items']>;

/**
 * Wrap each clickable menu item with a unified click tracker, preserving any
 * existing onClick. Skips dividers and items without a key. Used to measure
 * which footer menu entries get clicked (breakdown by `key`).
 */
const injectMenuTracking = (
  items: FooterMenuItems,
  track: (key: string) => void,
): FooterMenuItems =>
  items.map((item) => {
    if (!item || (item as { type?: string }).type === 'divider') return item;
    const key = (item as { key?: string | number }).key;
    if (!key) return item;
    const originalOnClick = (item as { onClick?: (info: unknown) => void }).onClick;
    return {
      ...item,
      onClick: (info: unknown) => {
        track(String(key));
        originalOnClick?.(info);
      },
    };
  });

/**
 * Collect the keys of click-trackable items — the exact same set wrapped by
 * `injectMenuTracking` (non-divider items with a key). Used so the menu-open
 * exposure event reports only keys that can later emit `home_footer_menu_clicked`,
 * keeping per-key CTR denominators and numerators aligned. Billboard items are
 * excluded here (they emit their own `billboard_*` events).
 */
const collectMenuKeys = (items: FooterMenuItems): string[] =>
  items
    .filter((item) => item && (item as { type?: string }).type !== 'divider')
    .map((item) => (item as { key?: string | number }).key)
    .filter((key): key is string | number => Boolean(key))
    .map(String);

const Footer = memo(() => {
  const { t } = useTranslation('common');
  const { analytics } = useAnalytics();
  const { footer } = useNavLayout();
  const brand = useBrand();
  const hasActiveWorkspace = useHasActiveWorkspace();
  const settingLabelKey = hasActiveWorkspace ? 'userPanel.workspaceSetting' : 'userPanel.setting';
  const activeNavKey = useActiveNavKey();
  const isHomeSidebar = activeNavKey === 'home';
  const billboardMenuItems = useBillboardMenuItems();
  const enableBusinessFeatures = useServerConfigStore(serverConfigSelectors.enableBusinessFeatures);
  const customization = useServerConfigStore((s) => s.serverConfig.customization);
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);
  const { data: configuredHelpMenuItems } = useSWR(PUBLIC_HELP_MENU_SWR_KEY, () =>
    adminCommercialService.getPublicHelpMenu(),
  );

  const trackMenuClick = useCallback(
    (key: string) => {
      try {
        analytics?.track({
          name: 'home_footer_menu_clicked',
          properties: { key, spm: `homepage.footer.${key}.clicked` },
        });
      } catch {
        // silently ignore tracking errors to avoid affecting business logic
      }
    },
    [analytics],
  );

  const handleOpenChangelogModal = useCallback(() => {
    openChangelogModal();
  }, []);

  const handleOpenFeedbackModal = useCallback(() => {
    openFeedbackModal();
  }, []);

  const handleOpenProductHuntCard = useCallback(() => {
    window.open(CHITUO_PUBLIC_LINKS.website, '_blank', 'noopener,noreferrer');
  }, []);

  const customHelpItems = useMemo(
    () => buildCustomHelpMenuItems(customization?.helpMenuItems),
    [customization?.helpMenuItems],
  );
  const hasCustomHelpItems = customHelpItems.length > 0;

  const defaultHelpMenuItems = useMemo<FooterMenuItems>(
    () => [
      ...(footer.showSettingsEntry && !isDevMode
        ? [
            {
              icon: <Icon icon={Settings2} />,
              key: 'setting',
              label: <WorkspaceLink to="/settings">{t(settingLabelKey)}</WorkspaceLink>,
            },
            {
              type: 'divider' as const,
            },
          ]
        : []),
      ...(enableBusinessFeatures
        ? [
            {
              icon: <Icon icon={Send} />,
              key: 'inviteFriend',
              label: (
                <WorkspaceLink to="/settings/referral">{t('userPanel.inviteFriend')}</WorkspaceLink>
              ),
            },
          ]
        : []),
      ...(hasCustomHelpItems
        ? customHelpItems
        : [
            {
              icon: <Icon icon={Download} />,
              key: 'get-app',
              label: <WorkspaceLink to="/downloads">{t('getApp')}</WorkspaceLink>,
            },
            {
              icon: <Icon icon={Globe2} />,
              key: 'website',
              label: (
                <a href={CHITUO_PUBLIC_LINKS.website} rel="noopener noreferrer" target="_blank">
                  驰拓官网
                </a>
              ),
            },
            {
              icon: <Icon icon={Mail} />,
              key: 'contact',
              label: (
                <a href={CHITUO_PUBLIC_LINKS.support} rel="noopener noreferrer" target="_blank">
                  联系我们
                </a>
              ),
            },
            ...(footer.showEvalEntry && footer.layout === 'compact'
              ? [
                  {
                    icon: <Icon icon={FlaskConical} />,
                    key: 'eval',
                    label: <WorkspaceLink to="/eval">Evaluation Lab</WorkspaceLink>,
                  },
                ]
              : []),
          ]),
    ],
    [
      customHelpItems,
      enableBusinessFeatures,
      footer.layout,
      footer.showEvalEntry,
      footer.showSettingsEntry,
      hasCustomHelpItems,
      isDevMode,
      settingLabelKey,
      t,
    ],
  );

  const configuredMenuItems = useMemo(
    () =>
      Array.isArray(configuredHelpMenuItems)
        ? createConfiguredHelpMenuItems(configuredHelpMenuItems, {
            onChangelog: handleOpenChangelogModal,
            onFeedback: handleOpenFeedbackModal,
            onProductHunt: handleOpenProductHuntCard,
          })
        : [],
    [
      configuredHelpMenuItems,
      handleOpenChangelogModal,
      handleOpenFeedbackModal,
      handleOpenProductHuntCard,
    ],
  );

  const { helpMenuItems, trackedMenuKeys } = useMemo<{
    helpMenuItems: MenuProps['items'];
    trackedMenuKeys: string[];
  }>(() => {
    const ownItems = (
      Array.isArray(configuredHelpMenuItems) ? configuredMenuItems : defaultHelpMenuItems
    ) as FooterMenuItems;

    return {
      helpMenuItems: [
        ...injectMenuTracking(ownItems, trackMenuClick),
        ...(isHomeSidebar && billboardMenuItems && billboardMenuItems.length > 0
          ? [{ type: 'divider' as const }, ...billboardMenuItems]
          : []),
      ],
      trackedMenuKeys: collectMenuKeys(ownItems),
    };
  }, [
    billboardMenuItems,
    configuredHelpMenuItems,
    configuredMenuItems,
    defaultHelpMenuItems,
    isHomeSidebar,
    trackMenuClick,
  ]);

  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      if (!open) return;
      try {
        analytics?.track({
          name: 'home_footer_menu_opened',
          properties: { keys: trackedMenuKeys.join(','), spm: 'homepage.footer.opened' },
        });
      } catch {
        // silently ignore tracking errors to avoid affecting business logic
      }
    },
    [analytics, trackedMenuKeys],
  );

  return (
    <>
      {isHomeSidebar && enableBusinessFeatures && (
        <WorkspaceLink
          className={styles.memberLink}
          to={brand.sidebarMemberUrl || '/settings/plans'}
        >
          <Flexbox className={styles.memberCard} gap={5}>
            <Flexbox horizontal align="center" gap={6}>
              <Icon className={styles.memberIcon} icon={Crown} size={15} />
              <strong className={styles.memberTitle}>
                {brand.sidebarMemberLabel || '升级方案'}
              </strong>
              <Icon className={styles.memberSparkle} icon={Sparkles} size={13} />
            </Flexbox>
            <span className={styles.memberDescription}>解锁更多容量与高级功能。</span>
          </Flexbox>
        </WorkspaceLink>
      )}
      {footer.layout === 'expanded' ? (
        <Flexbox horizontal align={'center'} gap={2} justify={'space-between'} padding={8}>
          <Flexbox horizontal align={'center'} flex={1} gap={2}>
            <DropdownMenu
              items={helpMenuItems}
              placement="topLeft"
              onOpenChange={handleMenuOpenChange}
            >
              <ActionIcon
                aria-label={t('userPanel.help')}
                data-billboard-anchor=""
                icon={CircleHelp}
                size={16}
              />
            </DropdownMenu>
            <WorkspaceLink to="/eval">
              <ActionIcon icon={FlaskConical} size={16} title="Evaluation Lab" />
            </WorkspaceLink>
          </Flexbox>
          <ThemeButton placement={'topCenter'} size={16} />
        </Flexbox>
      ) : (
        <Flexbox horizontal align={'center'} gap={2} padding={8}>
          <DropdownMenu
            items={helpMenuItems}
            placement="topLeft"
            onOpenChange={handleMenuOpenChange}
          >
            <ActionIcon aria-label={t('userPanel.help')} icon={CircleHelp} size={16} />
          </DropdownMenu>
          {isDevMode && (
            <WorkspaceLink to="/settings">
              <ActionIcon
                aria-label={t(settingLabelKey)}
                icon={SettingsIcon}
                size={16}
                title={t(settingLabelKey)}
              />
            </WorkspaceLink>
          )}
        </Flexbox>
      )}
      {isHomeSidebar && <Billboard />}
    </>
  );
});

export default Footer;

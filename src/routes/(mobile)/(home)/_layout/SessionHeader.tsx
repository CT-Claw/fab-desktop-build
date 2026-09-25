'use client';

import { ActionIcon, Flexbox } from '@lobehub/ui';
import { ChatHeader } from '@lobehub/ui/mobile';
import { MessageSquarePlus } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ProductLogo } from '@/components/Branding';
import ImperativeModal from '@/components/ImperativeModal';
import LocalAssistantMarket from '@/features/LocalAssistantMarket';
import { MOBILE_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import { useMobileConfig } from '@/features/MobileWorkspace/useMobileConfig';
import UserAvatar from '@/features/User/UserAvatar';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { mobileHeaderSticky } from '@/styles/mobileHeader';

import { styles } from './SessionHeader/style';

const Header = memo(() => {
  const { t } = useTranslation('common');
  const { config } = useMobileConfig();
  const navigate = useWorkspaceAwareNavigate();
  const [showCatalog, setShowCatalog] = useState(false);
  const { displayName, logoUrl } = config.brand;
  const hasMobileBrand = Boolean(displayName || logoUrl);

  const createTitle = t('mobile.recent.createAgent');

  return (
    <>
      <ChatHeader
        style={mobileHeaderSticky}
        left={
          <Flexbox horizontal align="center" className={styles.leftContainer} gap={8}>
            <UserAvatar size={32} onClick={() => navigate('/me', { escape: true })} />
            {hasMobileBrand ? (
              <Flexbox horizontal align="center" gap={8}>
                {logoUrl ? (
                  <img
                    alt={displayName || createTitle}
                    className={styles.brandLogo}
                    src={logoUrl}
                  />
                ) : null}
                {displayName ? <span className={styles.brandName}>{displayName}</span> : null}
              </Flexbox>
            ) : (
              <ProductLogo type="text" />
            )}
          </Flexbox>
        }
        right={
          <ActionIcon
            data-testid="native-add-assistant-mobile"
            icon={MessageSquarePlus}
            size={MOBILE_HEADER_ICON_SIZE}
            title={createTitle}
            onClick={() => setShowCatalog(true)}
          />
        }
      />
      {showCatalog && (
        <ImperativeModal
          open
          footer={null}
          title={createTitle}
          onCancel={() => setShowCatalog(false)}
        >
          <LocalAssistantMarket
            embedded
            limit={6}
            onBrowse={() => setShowCatalog(false)}
            onInstalled={(id) => {
              setShowCatalog(false);
              navigate(`/agent/${encodeURIComponent(id)}`);
            }}
          />
        </ImperativeModal>
      )}
    </>
  );
});

Header.displayName = 'SessionHeader';

export default Header;

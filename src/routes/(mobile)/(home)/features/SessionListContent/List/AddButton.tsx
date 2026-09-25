import { Flexbox } from '@lobehub/ui';
import { Button } from '@lobehub/ui/base-ui';
import { Plus } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { useServerConfigStore } from '@/store/serverConfig';

const AddButton = memo<{ groupId?: string }>(() => {
  const { t } = useTranslation('chat');
  const navigate = useWorkspaceAwareNavigate();
  const mobile = useServerConfigStore((s) => s.isMobile);

  return (
    <Flexbox flex={1} padding={mobile ? 16 : 0}>
      <Button
        block
        icon={Plus}
        type={'fill'}
        style={{
          marginTop: 8,
        }}
        onClick={() => navigate('/community/agent')}
      >
        {t('newAgent')}
      </Button>
    </Flexbox>
  );
});

export default AddButton;

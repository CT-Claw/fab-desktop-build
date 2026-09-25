import { ActionIcon, Flexbox } from '@lobehub/ui';
import { Button } from '@lobehub/ui/base-ui';
import { PencilLineIcon, X } from 'lucide-react';
import { memo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ImperativeModal from '@/components/ImperativeModal';
import {
  type ActionKeys,
  type ChatInputEditor,
  ChatInputProvider,
  DesktopChatInput,
} from '@/features/ChatInput';
import LocalAssistantMarket from '@/features/LocalAssistantMarket';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';

const LEFT_ACTIONS: ActionKeys[] = ['model'];

export interface CreateAgentModalProps {
  agentId?: string;
  onClose: () => void;
  onCreateBlank: () => Promise<void> | void;
  onOpenSkills?: (identifier: string) => void;
  onSubmit: (prompt: string) => Promise<void> | void;
  onTryInLobeAI?: () => Promise<void> | void;
  open: boolean;
  type: 'agent' | 'group';
}

export const CreateAgentModal = memo<CreateAgentModalProps>(
  ({ open, type, agentId, onClose, onSubmit, onCreateBlank }) => {
    const { t } = useTranslation('chat');
    const navigate = useWorkspaceAwareNavigate();
    const editorRef = useRef<ChatInputEditor | null>(null);
    const content = useRef('');
    const busy = useRef(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const create = async (blank: boolean) => {
      if (busy.current || (!blank && !content.current.trim())) return;
      busy.current = true;
      setLoading(true);
      setError(false);
      try {
        if (blank) await onCreateBlank();
        else await onSubmit(content.current.trim());
        onClose();
      } catch {
        setError(true);
      } finally {
        busy.current = false;
        setLoading(false);
      }
    };

    return (
      <ImperativeModal
        centered
        destroyOnHidden
        closable={false}
        footer={null}
        open={open}
        title={false}
        width="min(90vw, 760px)"
        onCancel={onClose}
        styles={{ body: { padding: 0, maxHeight: '85vh', overflow: 'auto' } }}
      >
        <Flexbox gap={16} padding={20}>
          <Flexbox horizontal align="center" gap={4} justify="flex-end">
            <Button
              disabled={loading}
              icon={<PencilLineIcon size={14} />}
              type="text"
              onClick={() => void create(true)}
            >
              {t('createModal.createBlank')}
            </Button>
            <ActionIcon icon={X} onClick={onClose} />
          </Flexbox>
          <h3 style={{ fontSize: 20, margin: 0 }}>
            {t(type === 'agent' ? 'createModal.title' : 'createModal.groupTitle')}
          </h3>
          <ChatInputProvider
            agentId={agentId}
            allowExpand={false}
            leftActions={LEFT_ACTIONS}
            chatInputEditorRef={(instance) => {
              editorRef.current = instance;
            }}
            sendButtonProps={{ generating: loading, onStop: () => {}, shape: 'round' }}
            onSend={() => void create(false)}
            onMarkdownContentChange={(value) => {
              content.current = value;
            }}
          >
            <DesktopChatInput
              inputContainerProps={{ minHeight: 88, resize: false }}
              showControlBar={false}
              placeholder={t(
                type === 'agent' ? 'createModal.placeholder' : 'createModal.groupPlaceholder',
              )}
            />
          </ChatInputProvider>
          {error && <p role="alert">{t('localMarket.installError', { ns: 'discover' })}</p>}
          <LocalAssistantMarket
            embedded
            limit={6}
            onBrowse={onClose}
            onInstalled={(id) => {
              onClose();
              navigate(`/agent/${encodeURIComponent(id)}`);
            }}
          />
        </Flexbox>
      </ImperativeModal>
    );
  },
);

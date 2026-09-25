import { upsertPluginMode } from '@lobechat/types';

import { lambdaClient } from '@/libs/trpc/client';
import { agentService } from '@/services/agent';

import { getLocalAssistantConfig, localMarketIdentifier } from './catalog';
import { isFabPluginPinned } from './offlineProfile';

export const installLocalAssistant = async (identifier: string, userId: string) => {
  if (!userId) throw new Error('Local application sign-in required');
  const config = getLocalAssistantConfig(identifier);
  const existingId = await agentService.getAgentByMarketIdentifier(
    localMarketIdentifier(identifier),
    true,
  );

  if (existingId) {
    // The ownedPrivateOnly lookup already enforces caller ownership and private visibility.
    // Re-running the install is also the migration path for assistants created
    // before the Fab skill catalog was registered in the image.
    const existingConfig = await agentService.getAgentConfigById(existingId);
    let plugins = existingConfig.plugins;
    for (const plugin of config.plugins ?? []) {
      if (plugin.mode === 'pinned' && !isFabPluginPinned(plugins, plugin.identifier))
        plugins = upsertPluginMode(plugins, plugin.identifier, plugin.mode);
    }
    await agentService.updateAgentConfig(existingId, { plugins });
    await lambdaClient.connector.provisionFabOfflineKnowledge.mutate({
      agentId: existingId,
    });
    return { agentId: existingId };
  }

  const result = await agentService.createAgent({
    config,
    visibility: 'private',
  });
  await lambdaClient.connector.provisionFabOfflineKnowledge.mutate({
    agentId: result.agentId,
  });
  return result;
};

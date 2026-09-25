import type { BuiltinSkill } from '@lobechat/types';

import { systemPrompt } from './content';
export { fabEngineeringSkills, fabSkillDefinitions, fabSkillIdentifier } from './catalog';

export const FabEngineeringIdentifier = 'fab-engineering';

export const FabEngineeringSkill: BuiltinSkill = {
  avatar: '🏭',
  content: systemPrompt,
  description:
    'Offline semiconductor engineering workflow for the 18 fab facility and integration domains, with evidence, calculation, safety, and human-review boundaries.',
  identifier: FabEngineeringIdentifier,
  name: 'fab-engineering',
  title: '驰拓半导体工程',
  source: 'builtin',
};

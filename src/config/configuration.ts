import { Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

export default () => {
  let yamlConfigFileName = 'config.yaml';
  Logger.log(' ============================================= ');
  Logger.log(` Loading Environment: ${process.env.NODE_ENV} `);
  Logger.log(' ============================================= ');
  const env = process.env.NODE_ENV;
  switch (env) {
    case 'production':
      yamlConfigFileName = 'config.production.yaml';
      break;
    case 'staging':
      yamlConfigFileName = 'config.staging.yaml';
      break;
    case 'test':
      yamlConfigFileName = 'config.testing.yaml';
      break;
    default:
      yamlConfigFileName = 'config.yaml';
  }

  const configPath = './';

  return yaml.load(
    readFileSync(join(configPath, yamlConfigFileName), 'utf8'),
  ) as Record<string, any>;
};

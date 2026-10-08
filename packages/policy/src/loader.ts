import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { PolicyConfig } from './types';

export function loadPolicy(filePath: string): PolicyConfig {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(fileContents) as any;
  
  // Basic validation could go here
  if (!data || !data.global || !data.rules) {
    throw new Error('Invalid policy configuration format');
  }

  return data as PolicyConfig;
}

import {defineConfig} from 'astro/config';
import {existsSync} from 'node:fs';
import {loadEnvFile} from 'node:process';

if (existsSync('.env')) loadEnvFile('.env');

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || undefined,
});

import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {project} from './schemaTypes/project';
import {siteSettings} from './schemaTypes/siteSettings';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;
if (!projectId || !dataset) throw new Error('Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET in studio/.env before starting Studio. See README.md.');

export default defineConfig({
  name: 'geo', title: 'Portfolio Studio', projectId, dataset,
  plugins: [structureTool({
    structure: S => S.list().title('Your portfolio').items([
      S.listItem().title('Website settings').id('siteSettings').child(
        S.document().schemaType('siteSettings').documentId('siteSettings'),
      ),
      S.documentTypeListItem('project').title('Films & projects'),
    ]),
  })],
  schema: {
    types: [project, siteSettings],
    templates: templates => templates.filter(template => template.schemaType !== 'siteSettings'),
  },
  document: {
    actions: (actions, context) => context.schemaType === 'siteSettings'
      ? actions.filter(action => !['delete', 'duplicate', 'unpublish'].includes(action.action || ''))
      : actions,
    newDocumentOptions: options => options.filter(option => option.templateId !== 'siteSettings'),
  },
});

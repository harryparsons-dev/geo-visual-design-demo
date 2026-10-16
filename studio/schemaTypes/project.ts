import {defineField, defineType} from 'sanity';
import {getYouTubeId} from '../../src/lib/video';

export const project = defineType({
  name: 'project', title: 'Project', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Film title', type: 'string', validation: rule => rule.required().max(100)}),
    defineField({
      name: 'slug', title: 'Page address', type: 'slug', options: {source: 'title', maxLength: 96},
      description: 'Generate this from the title. Changing it after publishing changes the page URL.',
      validation: rule => rule.required().custom(value => !value?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current) || 'Use lowercase letters, numbers and single hyphens.'),
    }),
    defineField({name: 'category', type: 'string', description: 'For example: Documentary, Brand film, Music video.', validation: rule => rule.required().max(50)}),
    defineField({name: 'year', type: 'number', initialValue: () => new Date().getFullYear(), validation: rule => rule.required().integer().min(1900).max(2100)}),
    defineField({
      name: 'videoUrl', title: 'YouTube link', type: 'url',
      description: 'Upload the film to YouTube with embedding enabled, then paste its public or unlisted link here. Unlisted does not mean private.',
      validation: rule => rule.required().custom(value => !value || getYouTubeId(value) !== null || 'Paste a valid HTTPS YouTube video link.'),
    }),
    defineField({
      name: 'thumbnail', title: 'Cover image', type: 'image',
      description: 'A landscape image works best (ideally 16:9).',
      validation: rule => rule.required().assetRequired(),
      fields: [defineField({name: 'alt', title: 'Image description', type: 'string', description: 'Describe the image for visitors using screen readers.', validation: rule => rule.required().max(200)})],
    }),
    defineField({name: 'description', title: 'About the film', type: 'text', rows: 6, validation: rule => rule.required().max(4000)}),
    defineField({name: 'credits', type: 'text', rows: 3}),
    defineField({name: 'featured', title: 'Featured film', type: 'boolean', initialValue: false, description: 'Featured films appear before other work.'}),
    defineField({name: 'order', title: 'Display order', type: 'number', initialValue: 10, description: 'Lower numbers appear first within featured / other films.', validation: rule => rule.required().integer().min(0)}),
  ],
  orderings: [{title: 'Portfolio order', name: 'portfolioOrder', by: [{field: 'featured', direction: 'desc'}, {field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'category', media: 'thumbnail'}},
});

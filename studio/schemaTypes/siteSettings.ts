import {defineField, defineType} from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings', title: 'Website settings', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name / wordmark', type: 'string', validation: rule => rule.required().max(50)}),
    defineField({name: 'tagline', title: 'Homepage headline', type: 'string', validation: rule => rule.required().max(100)}),
    defineField({name: 'introduction', title: 'Short introduction', type: 'text', rows: 3, validation: rule => rule.required().max(350)}),
    defineField({name: 'about', title: 'About you', type: 'text', rows: 6, validation: rule => rule.required().max(3000)}),
    defineField({name: 'email', title: 'Contact email', type: 'string', validation: rule => rule.required().email()}),
    defineField({name: 'location', title: 'Location / availability', type: 'string', validation: rule => rule.max(150)}),
    defineField({name: 'services', type: 'array', of: [{type: 'string'}], validation: rule => rule.required().min(1).max(10)}),
  ],
  preview: {prepare: () => ({title: 'Website settings'})},
});

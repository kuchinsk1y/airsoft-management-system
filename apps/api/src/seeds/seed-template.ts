import * as fs from 'fs';
import mongoose from 'mongoose';
import * as path from 'path';
import { TemplateSchema } from '../template/schemas/template.schema';
import { MONGODB_URI } from '../utils/config';
import { BannerData } from './interfaces';

type SeedSeoParams = {
  title: string;
  description?: string;
  canonicalUrl: string;
};

function buildSeoDefaults({
  title,
  description,
  canonicalUrl,
}: SeedSeoParams) {
  return {
    browserTitle: `${title} | Strike Shop Action`,
    ruBrowserTitle: '',
    metaDescription: description ?? '',
    ruMetaDescription: '',
    index: true,
    follow: true,
    includeSitemap: true,
    canonicalUrl,
    seoText: '',
  };
}

async function seedPages() {
  try {
    await mongoose.connect(MONGODB_URI);
    const TemplateModel = mongoose.model('Template', TemplateSchema);

    const rulesPath = path.resolve(__dirname, 'data', 'rules.json');
    const contactsPath = path.resolve(__dirname, 'data', 'contacts.json');
    const mainPath = path.resolve(__dirname, 'data', 'main.json');
    const bannerCreateGamePath = path.resolve(
      __dirname,
      'data',
      'banner-create-game.json',
    );
    const bannerJoinPath = path.resolve(__dirname, 'data', 'banner-join.json');
    const workshopPath = path.resolve(__dirname, 'data', 'workshop.json');

    const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
    const contactsData = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));
    const mainData = JSON.parse(fs.readFileSync(mainPath, 'utf-8'));
    const bannerCreateGameData = JSON.parse(
      fs.readFileSync(bannerCreateGamePath, 'utf-8'),
    ) as BannerData;
    const bannerJoinData = JSON.parse(
      fs.readFileSync(bannerJoinPath, 'utf-8'),
    ) as BannerData;
    const workshopData = JSON.parse(fs.readFileSync(workshopPath, 'utf-8'));

    await TemplateModel.deleteMany({});

    await TemplateModel.insertMany([
      {
        pageKey: 'rules',
        config: {
          title: 'Правила Страйкболу',
          description:
            'Страйкбол - це мілітаризована гра, з використанням  ігрової зброї, яка використовує 6мм та 8мм пластикові кульки в якості набоїв, та працює за пневматичним принципом.',
          content: rulesData,
          seo: buildSeoDefaults({
            title: 'Правила Страйкболу',
            description:
              'Страйкбол - це мілітаризована гра, з використанням ігрової зброї, яка використовує 6мм та 8мм пластикові кульки в якості набоїв, та працює за пневматичним принципом.',
            canonicalUrl: '/rules',
          }),
        },
      },
      {
        pageKey: 'contacts',
        config: {
          title: 'Контакти',
          description: "Як з нами зв'язатися",
          content: contactsData,
          seo: buildSeoDefaults({
            title: 'Контакти',
            description: "Як з нами зв'язатися",
            canonicalUrl: '/contacts',
          }),
        },
      },
      {
        pageKey: 'rental',
        config: {
          title: 'ПРОКАТ СПОРЯДЖЕННЯ',
          breadcrumbs: ['ГОЛОВНА', 'ПРОКАТ СПОРЯДЖЕННЯ'],
          banners: {
            creategame: bannerCreateGameData,
            join: bannerJoinData,
          },
          seo: buildSeoDefaults({
            title: 'Прокат спорядження',
            canonicalUrl: '/rental',
          }),
        },
      },
      {
        pageKey: 'products',
        config: {
          breadcrumbs: ['ГОЛОВНА', 'ПРОКАТ СПОРЯДЖЕННЯ'],
          seo: buildSeoDefaults({
            title: 'Прокат спорядження',
            canonicalUrl: '/products',
          }),
        },
      },
      {
        pageKey: 'events',
        config: {
          title: 'КАЛЕНДАР ПОДІЙ',
          breadcrumbs: ['ГОЛОВНА', 'КАЛЕНДАР ПОДІЙ'],
          banners: {
            creategame: bannerCreateGameData,
            join: bannerJoinData,
          },
          seo: buildSeoDefaults({
            title: 'Календар подій',
            canonicalUrl: '/events',
          }),
        },
      },
      {
        pageKey: 'main',
        config: {
          title: 'Страйкбол івенти',
          description:
            'Організація корпоративів, Приватні ігри, або Оренда обладнання. Групові і персональні курси з тактики та медицини.',
          content: mainData,
          seo: buildSeoDefaults({
            title: 'Страйкбол івенти',
            description:
              'Організація корпоративів, приватні ігри або оренда обладнання. Групові й персональні курси з тактики та медицини.',
            canonicalUrl: '/',
          }),
        },
      },
      {
        pageKey: 'workshop',
        config: {
          ...workshopData,
          seo: buildSeoDefaults({
            title: 'Майстерня',
            canonicalUrl: '/workshop',
          }),
        },
      },
      {
        pageKey: 'about',
        config: {
          title: 'Про компанію',
          content: '',
          seo: buildSeoDefaults({
            title: 'Про компанію',
            canonicalUrl: '/about',
          }),
        },
      },
      {
        pageKey: 'gallery',
        config: {
          title: 'ГАЛЕРЕЯ',
          content:
            'Фото з життя клубу, івентів, полігонів та команди Strike Shop Action.',
          seo: buildSeoDefaults({
            title: 'Галерея',
            description:
              'Фото з івентів, полігонів та життя команди Strike Shop Action.',
            canonicalUrl: '/gallery',
          }),
        },
      },
      {
        pageKey: 'weekend-game',
        config: {
          title: 'Гра вихідного дня',
          content: '',
          seo: buildSeoDefaults({
            title: 'Гра вихідного дня',
            canonicalUrl: '/weekend-game',
          }),
        },
      },
    ]);

    console.log('✅ Pages successfully seeded');
  } catch (error) {
    console.error('❌ Error while seeding pages:', error);
  } finally {
    await mongoose.disconnect();
  }
}

void seedPages();

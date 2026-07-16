import { useApp } from '../state/AppContext.jsx'
import { useLanguage } from '../state/LanguageContext.jsx'
import { COMMON } from '../i18n/common.js'
import PageHeader from '../components/PageHeader.jsx'
import { SearchGlyph } from '../components/Illustrations.jsx'

const FAQ_ITEMS = {
  fr: [
    {
      cat: 'Fonctionnement',
      q: "L'IA se trompe-t-elle parfois sur les ingrédients détectés ?",
      a: "Oui, c'est possible, surtout sur une photo peu nette ou avec beaucoup d'aliments empilés. C'est pour ça que la liste est toujours modifiable : vous pouvez décocher, renommer (via les suggestions alternatives) ou ajouter un ingrédient manuellement avant de générer vos recettes.",
    },
    {
      cat: 'Confidentialité',
      q: 'Mes photos sont-elles conservées quelque part ?',
      a: "Non. La photo est envoyée à l'API Google Gemini uniquement pour l'analyse, via une fonction serverless qui ne la stocke pas. Elle n'est jamais sauvegardée sur un serveur FrigoMind.",
    },
    {
      cat: 'Prix',
      q: "Est-ce que l'app est vraiment gratuite ?",
      a: "Oui. FrigoMind utilise Google Gemini, qui propose un palier gratuit sans carte bancaire pour la reconnaissance d'image. Si cette clé n'est pas configurée sur le déploiement, l'app fonctionne quand même : vous ajoutez simplement vos ingrédients à la main.",
    },
    {
      cat: 'Fonctionnement',
      q: "Pourquoi certaines recettes proposées contiennent des ingrédients que je n'ai pas ?",
      a: "FrigoMind garantit que toutes les recettes proposées utilisent OBLIGATOIREMENT tous les ingrédients que vous avez validés. En revanche, elle peut suggérer un ou deux ingrédients supplémentaires à acheter, ou des basiques de placard (sel, poivre, huile...) qu'on suppose toujours disponibles.",
    },
    {
      cat: 'Fonctionnement',
      q: "Que se passe-t-il si je n'ai pas assez d'ingrédients pour une vraie recette ?",
      a: "FrigoMind ne bloque jamais : si aucune recette de la base ne correspond à votre combinaison d'ingrédients, l'app génère automatiquement des recettes maison simples (poêlée, bol frais, gratin, soupe, wok) qui utilisent exactement ce que vous avez.",
    },
    {
      cat: 'Anti-gaspi',
      q: "C'est quoi le mode anti-gaspi ?",
      a: 'Une fonctionnalité bonus qui priorise les recettes utilisant des ingrédients périssables (comme les produits laitiers, la viande fraîche ou les herbes) pour vous aider à les consommer avant qu\'ils ne soient perdus.',
    },
    {
      cat: 'Technique',
      q: "Mon historique de recettes est-il synchronisé entre mes appareils ?",
      a: "Oui : historique, favoris et préférences sont sauvegardés à la fois sur cet appareil (pour un affichage instantané) et dans le cloud tant que vous êtes connecté au même compte, pour les retrouver sur un autre appareil.",
    },
    {
      cat: 'Technique',
      q: 'Puis-je utiliser FrigoMind sans connexion internet ?',
      a: "La partie interface fonctionne, mais l'analyse photo par IA nécessite une connexion (elle appelle une API externe). Sans connexion, vous pouvez toujours ajouter vos ingrédients manuellement.",
    },
    {
      cat: 'Fonctionnement',
      q: 'Puis-je utiliser FrigoMind pour un régime particulier (végétarien, sans gluten...) ?',
      a: "Le panneau de préférences propose un filtre végétarien. Pour les autres régimes, vous pouvez décocher manuellement les ingrédients incompatibles avant de générer vos recettes : FrigoMind s'adapte toujours à la liste validée, jamais l'inverse.",
    },
    {
      cat: 'Prix',
      q: 'FrigoMind va-t-il rester gratuit ?',
      a: "FrigoMind est un projet MVP en évolution. L'objectif reste un usage gratuit pour l'analyse de base ; toute évolution du modèle sera annoncée sur la page Nouveautés.",
    },
  ],
  en: [
    {
      cat: 'How it works',
      q: 'Does the AI sometimes get the detected ingredients wrong?',
      a: "Yes, it's possible, especially with a blurry photo or lots of stacked food. That's why the list is always editable: you can uncheck, rename (via alternative suggestions), or manually add an ingredient before generating your recipes.",
    },
    {
      cat: 'Privacy',
      q: 'Are my photos stored anywhere?',
      a: "No. The photo is sent to the Google Gemini API only for analysis, via a serverless function that doesn't store it. It's never saved on a FrigoMind server.",
    },
    {
      cat: 'Pricing',
      q: 'Is the app really free?',
      a: "Yes. FrigoMind uses Google Gemini, which offers a free tier with no credit card for image recognition. If this key isn't configured on the deployment, the app still works: you simply add your ingredients by hand.",
    },
    {
      cat: 'How it works',
      q: "Why do some suggested recipes contain ingredients I don't have?",
      a: 'FrigoMind guarantees that every suggested recipe uses ALL the ingredients you validated. However, it may suggest one or two additional ingredients to buy, or pantry staples (salt, pepper, oil...) that are always assumed to be available.',
    },
    {
      cat: 'How it works',
      q: "What happens if I don't have enough ingredients for a real recipe?",
      a: "FrigoMind never gets stuck: if no recipe in the database matches your ingredient combination, the app automatically generates simple homemade recipes (stir-fry, fresh bowl, bake, soup, wok) that use exactly what you have.",
    },
    {
      cat: 'Zero-waste',
      q: "What's zero-waste mode?",
      a: 'A bonus feature that prioritizes recipes using perishable ingredients (like dairy, fresh meat, or herbs) to help you use them before they go to waste.',
    },
    {
      cat: 'Technical',
      q: 'Is my recipe history synced across my devices?',
      a: "Yes: history, favorites, and preferences are saved both on this device (for instant display) and in the cloud as long as you're signed in to the same account, so you can find them on another device.",
    },
    {
      cat: 'Technical',
      q: 'Can I use FrigoMind without an internet connection?',
      a: "The interface itself works, but AI photo analysis requires a connection (it calls an external API). Without a connection, you can still add your ingredients manually.",
    },
    {
      cat: 'How it works',
      q: 'Can I use FrigoMind for a specific diet (vegetarian, gluten-free...)?',
      a: "The preferences panel offers a vegetarian filter. For other diets, you can manually uncheck incompatible ingredients before generating your recipes: FrigoMind always adapts to the validated list, never the other way around.",
    },
    {
      cat: 'Pricing',
      q: 'Will FrigoMind stay free?',
      a: "FrigoMind is an evolving MVP project. The goal remains free use for basic analysis; any change to the model will be announced on the What's New page.",
    },
  ],
}

const CATEGORY_TONE = {
  fr: {
    Fonctionnement: 'badge-fresh',
    Confidentialité: 'badge-neutral',
    Prix: 'badge-zest',
    'Anti-gaspi': 'badge-fresh',
    Technique: 'badge-neutral',
  },
  en: {
    'How it works': 'badge-fresh',
    Privacy: 'badge-neutral',
    Pricing: 'badge-zest',
    'Zero-waste': 'badge-fresh',
    Technical: 'badge-neutral',
  },
}

const STRINGS = {
  fr: {
    title: 'Questions fréquentes',
    subtitle: "Tout ce qu'il faut savoir pour bien utiliser FrigoMind.",
    otherQuestion: 'Une autre question ?',
    seeAbout: 'Voir la page À propos',
  },
  en: {
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know to make the most of FrigoMind.',
    otherQuestion: 'Have another question?',
    seeAbout: 'See the About page',
  },
}

// Page FAQ : questions fréquentes, regroupées par thème.
export default function FaqPage() {
  const { goTo } = useApp()
  const lang = useLanguage()
  const s = STRINGS[lang]
  const items = FAQ_ITEMS[lang]
  const categoryTone = CATEGORY_TONE[lang]

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 animate-fadeIn">
      <PageHeader
        onBack={() => goTo('home')}
        icon={<SearchGlyph className="w-full h-full" />}
        tone="zest"
        title={s.title}
        subtitle={s.subtitle}
      />

      <div className="mt-7 space-y-3">
        {items.map((item) => (
          <div key={item.q} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-neutral-900">{item.q}</p>
              <span className={`badge ${categoryTone[item.cat] || 'badge-neutral'} shrink-0 whitespace-nowrap`}>
                {item.cat}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-neutral-400">
        {s.otherQuestion}{' '}
        <button onClick={() => goTo('about')} className="text-fresh-700 underline underline-offset-2">
          {s.seeAbout}
        </button>
        .
      </p>
    </div>
  )
}

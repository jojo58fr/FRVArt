import heroImage from '../assets/FRVtubers_Vart.png';
import kokoriBG from '../assets/kokoriBG.png';
import onboarding2 from '../assets/onboarding_2.jpg';
import onboarding3 from '../assets/onboarding_3.png';

const baseAuthor = {
  did: 'did:frvart:onboarding',
  handle: 'guide.frvart',
  displayName: 'FRVArt Guide',
  avatar: heroImage,
  viewer: {},
};

const ONBOARDING_CARDS = [
  {
    uri: 'onboarding-welcome',
    cid: 'onboarding-welcome',
    author: baseAuthor,
    text: 'Bienvenue sur FRVArt',
    indexedAt: '2024-01-01T00:00:00.000Z',
    likeCount: 0,
    replyCount: 0,
    repostCount: 0,
    viewer: {},
    tags: [],
    langs: ['fr'],
    onboarding: {
      badge: 'Bienvenue',
      title: 'Bienvenue sur FRVArt',
      description:
        'Swipe vers le haut pour découvrir les créations de la communauté francophone sur Bluesky. Connecte-toi pour suivre, liker, commenter et épingler tes posts favoris.',
      backgroundImage: kokoriBG,
      background:
        'linear-gradient(140deg, rgba(108, 88, 255, 0.4), rgba(24, 28, 56, 0.92))',
      illustrationAlt: 'FRVArt',
      credit: {
        label: '@woliselene.bsky.social',
        href: 'https://bsky.app/profile/woliselene.bsky.social',
      },
      chips: ['Swipe vers le haut', 'Découvre des artistes virtuels FR', 'Épingles tes coups de coeur'],
      ctas: [
        { label: 'Se connecter', action: 'login', variant: 'primary' },
        { label: 'Voir le changelog', action: 'changelog', variant: 'ghost' },
      ],
      tip: "Tu auras besoin d'un app password Bluesky : Paramètres -> Avancés -> App passwords.",
    },
  },
  {
    uri: 'onboarding-actions',
    cid: 'onboarding-actions',
    author: baseAuthor,
    text: 'Interagis avec les artistes',
    indexedAt: '2024-01-02T00:00:00.000Z',
    likeCount: 0,
    replyCount: 0,
    repostCount: 0,
    viewer: {},
    tags: [],
    langs: ['fr'],
    onboarding: {
      badge: 'Astuces',
      title: 'Interagis comme sur TikTok',
      description:
        "L'endroit parfait pour doomscroll de l'art fait par des VArtist ! L'icône d'épingle pour garder une collection complète sous la main.",
      credit: {
        label: '@mariusmunier.fr',
        href: 'https://bsky.app/profile/mariusmunier.fr',
      },
      backgroundImage: onboarding2,
      background:
        'linear-gradient(145deg, rgba(255, 130, 180, 0.78), rgba(52, 18, 68, 0.9))',
      chips: ['Bouton + pour suivre', 'Coeur pour aimer', 'Bulle pour commenter'],
      ctas: [{ label: 'Voir mes épingles', action: 'pins', variant: 'ghost' }],
      tip: "Tes épinglés restent stockées localement. Tu peux les consulter même sans compte.",
    },
  },
  {
    uri: 'onboarding-partage',
    cid: 'onboarding-partage',
    author: baseAuthor,
    text: 'Partage ton art',
    indexedAt: '2024-01-03T00:00:00.000Z',
    likeCount: 0,
    replyCount: 0,
    repostCount: 0,
    viewer: {},
    tags: [],
    langs: ['fr'],
    onboarding: {
      badge: 'Social',
      title: 'Partage ton art',
      description:
        "Publie avec #FRVArt ou #VtuberFR pour apparaitre dans le flux. Nous mettons l'app à jour régulierement pour mettre en avant la communauté.",
      credit: {
        label: '@missflamme.bsky.social',
        href: 'https://bsky.app/profile/missflamme.bsky.social',
      },
      backgroundImage: onboarding3,
        background:
        'linear-gradient(145deg, rgba(96, 215, 255, 0.78), rgba(28, 62, 106, 0.92))',
      chips: ['#FRVArt', '#VtuberFR', '#blender', '#live2d', 'Créateurs francophones'],
      ctas: [
        { label: 'Supporte le projet', action: 'patreon', variant: 'primary' },
        { label: 'Voir le projet open-source', action: 'github', variant: 'ghost' }],
      tip: 'Tu peux même accéder au Github du projet si tu veux contribuer !',
    },
  },
  {
    uri: 'onboarding-community',
    cid: 'onboarding-community',
    author: baseAuthor,
    text: 'Rejoins la communaute',
    indexedAt: '2024-01-03T00:00:00.000Z',
    likeCount: 0,
    replyCount: 0,
    repostCount: 0,
    viewer: {},
    tags: [],
    langs: ['fr'],
    onboarding: {
      badge: 'Communauté',
      title: 'Rejoins la communauté',
      description:
        "Retrouve les artistes, Vtubers et fans du VTubing francophones & international sur notre Discord. Partage tes WIP, trouve des collab et suis les évènements FRVtubers.",
      background:
        'linear-gradient(145deg, rgba(96, 215, 255, 0.78), rgba(28, 62, 106, 0.92))',
      chips: ['Salons art & feedback', 'Opportunités de collab', 'Pleins d\'events communautaires FRVtubers'],
      ctas: [{ label: 'Rejoindre le Discord', action: 'discord', variant: 'primary' }],
      tip: 'Le Discord FRVtubers est ouvert aux artistes, fans et Vtubers :',
      tipLink: {
        label: 'https://discord.gg/meyHQYWvjU',
        href: 'https://discord.gg/meyHQYWvjU',
      },
    },
  },
];

export default ONBOARDING_CARDS;


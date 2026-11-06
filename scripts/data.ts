// Lieux et collectifs de départ, d'après la liste de Dark Lélé.
// Adresses vérifiées dans OpenStreetMap (Nominatim) le 2026-11-06.
// "à compléter" = introuvable ou non confirmé : à remplir à la main.

export type VenueSeed = {
  slug: string;
  name: string;
  address: string;
  postcode?: string;
  city: string;
  lat?: number;
  lng?: number;
  description?: string;
  listed?: boolean;
};

export const VENUES: VenueSeed[] = [
  // Salles de concert
  { slug: "les-docks", name: "Les Docks", address: "Avenue de Sévelin 34", postcode: "1004", city: "Lausanne", description: "Une des salles de concert les plus populaires de Lausanne, quartier de Sévelin, à deux pas du Flon." },
  { slug: "le-romandie", name: "Le Romandie", address: "Place de l'Europe 1A", postcode: "1003", city: "Lausanne", description: "Sous les arches du Grand-Pont, géré par l'association ...e la nave va. Concerts et nuits techno." },
  { slug: "la-breche", name: "La Brèche", address: "Passerelle du Grand-Pont", postcode: "1003", city: "Lausanne", description: "Nouvelle salle de l'Association du Salopard sous les arches du Grand-Pont, 160 personnes, cadre intimiste." },
  { slug: "les-jumeaux", name: "Les Jumeaux Jazz Club", address: "Rue de Genève 19", postcode: "1003", city: "Lausanne", description: "Club et bar au Flon, 300 personnes. Jazz et autres styles, artistes suisses et d'ailleurs." },
  { slug: "chorus", name: "Chorus", address: "Avenue Mon-Repos 3", postcode: "1005", city: "Lausanne", description: "Cave de jazz." },
  { slug: "salle-metropole", name: "Salle Métropole", address: "Rue des Terreaux", postcode: "1003", city: "Lausanne" },
  { slug: "casino-de-montbenon", name: "Casino de Montbenon (Salle Paderewski)", address: "Allée Ernest-Ansermet 3", postcode: "1003", city: "Lausanne", description: "Concerts, dont du jazz international à la Salle Paderewski." },
  { slug: "grande-salle-de-vennes", name: "Grande salle de Vennes", address: "à compléter", city: "Lausanne" },
  { slug: "opera-de-lausanne", name: "Opéra de Lausanne", address: "Avenue du Théâtre 12", postcode: "1006", city: "Lausanne" },
  { slug: "theatre-de-beaulieu", name: "Théâtre de Beaulieu", address: "Avenue des Bergières 10", postcode: "1004", city: "Lausanne", description: "Plus de 1600 places." },
  { slug: "ejma", name: "EJMA", address: "Rue des Côtes-de-Montbenon 26", postcode: "1003", city: "Lausanne", description: "École de jazz et de musique actuelle, concerts ponctuels." },
  // Clubs
  { slug: "mad", name: "MAD", address: "Rue de Genève 23", postcode: "1004", city: "Lausanne", description: "Club au Flon depuis 1985, 5 étages, 3 dancefloors." },
  { slug: "d-club", name: "D! Club", address: "Place des Pionnières 1", postcode: "1003", city: "Lausanne", description: "Deuxième plus grand club de Lausanne, électro, house, minimal." },
  { slug: "abc", name: "ABC Bar Club", address: "Place des Pionnières 4", postcode: "1003", city: "Lausanne", description: "Club plus intime, même bâtiment que le D!.", listed: false },
  { slug: "folklor", name: "Folklor", address: "Rue des Deux-Marchés", postcode: "1014", city: "Lausanne", description: "Club indépendant de 300 places sous la Riponne. Électro, public jeune et alternatif. Jeudi, vendredi et samedi dès minuit." },
  { slug: "pavillon", name: "Pavillon", address: "Place de la Riponne 10", postcode: "1005", city: "Lausanne", description: "Bar où Folklor organise aussi des soirées." },
  { slug: "le-bourg", name: "Le Bourg", address: "Rue de Bourg 51", postcode: "1003", city: "Lausanne", description: "Dans un ancien cinéma : concerts, DJ sets, projections, performances, vernissages." },
  { slug: "bleu-lezard", name: "Cave du Bleu Lézard", address: "Rue Jenny-Enning 10", postcode: "1003", city: "Lausanne", description: "Bistrot arty et petite cave souterraine, institution depuis 1992." },
  // Théâtres et arts de la scène
  { slug: "theatre-de-vidy", name: "Théâtre Vidy-Lausanne", address: "Avenue Émile-Jaques-Dalcroze 5", postcode: "1007", city: "Lausanne", description: "Théâtre de création : théâtre, danse, cirque, performance." },
  { slug: "arsenic", name: "Arsenic", address: "Rue de Genève 57", postcode: "1004", city: "Lausanne", description: "Centre d'art scénique contemporain : danse, théâtre, performance." },
  { slug: "tkm", name: "TKM Théâtre Kléber-Méleau", address: "Avenue de Malley", postcode: "1008", city: "Renens" },
  { slug: "sevelin-36", name: "Sévelin 36", address: "Avenue de Sévelin 36", postcode: "1004", city: "Lausanne", description: "Danse contemporaine." },
  { slug: "theatre-2-21", name: "Théâtre 2.21", address: "Rue de l'Industrie 10", postcode: "1005", city: "Lausanne", description: "Petit format, création contemporaine." },
  { slug: "pulloff", name: "Pulloff Théâtres", address: "Chemin du Calvaire", postcode: "1011", city: "Lausanne", description: "Petit format, création contemporaine." },
  { slug: "boulimie", name: "Théâtre Boulimie", address: "Place Marc-Louis-Arlaud 1", postcode: "1003", city: "Lausanne", description: "Humour." },
  { slug: "la-grange", name: "La Grange", address: "Allée de Dorigny, campus UNIL", city: "Lausanne" },
  { slug: "petit-theatre", name: "Le Petit Théâtre", address: "Place de la Cathédrale", postcode: "1014", city: "Lausanne", description: "Jeune public, à la Cité." },
  { slug: "theatre-des-lutins", name: "Théâtre des Lutins", address: "à compléter", city: "Lausanne" },
  { slug: "theatre-de-marionnettes", name: "Théâtre de marionnettes de Lausanne", address: "à compléter", city: "Lausanne" },
  { slug: "cpo-ouchy", name: "CPO Centre pluriculturel d'Ouchy", address: "Chemin de Beau-Rivage 2", postcode: "1006", city: "Lausanne" },
  { slug: "la-voirie", name: "Café-Théâtre de la Voirie", address: "à compléter", city: "Lausanne" },
  { slug: "octogone", name: "L'Octogone", address: "Avenue de Lavaux 41", postcode: "1009", city: "Pully" },
  { slug: "esprit-frappeur", name: "L'Esprit frappeur", address: "Route du Grand Pont 20", postcode: "1095", city: "Lutry" },
  { slug: "silo", name: "Silo", address: "à compléter", city: "Renens" },
  // Lieux alternatifs et pluridisciplinaires
  { slug: "terreaux", name: "Espace culturel des Terreaux", address: "Rue des Terreaux 14", postcode: "1002", city: "Lausanne", description: "Ancienne église reconvertie en centre culturel." },
  { slug: "vide-poche", name: "Théâtre du Vide-Poche", address: "Place de la Palud 10", postcode: "1003", city: "Lausanne", description: "Lieu de création ouvert aux artistes locaux, amateur·ices comme pros." },
  { slug: "pole-sud", name: "Pôle Sud", address: "Avenue Jean-Jacques-Mercier 3", postcode: "1003", city: "Lausanne" },
  { slug: "lapin-vert", name: "Le Lapin Vert", address: "Ruelle du Lapin-Vert 2", postcode: "1005", city: "Lausanne", description: "Bar rock à la Cité." },
  { slug: "espace-autogere", name: "Espace Autogéré", address: "Rue du Dr-César-Roux 30", postcode: "1014", city: "Lausanne", listed: false },
  { slug: "zelig", name: "Zelig", address: "à compléter", city: "Lausanne", description: "Bar étudiant de l'UNIL.", listed: false },
  { slug: "circuit", name: "Circuit", address: "à compléter", city: "Lausanne", description: "Centre d'art contemporain." },
  // Cinémas
  { slug: "cinematographe", name: "Le Cinématographe", address: "Allée Ernest-Ansermet 3", postcode: "1003", city: "Lausanne", description: "Cinéma mythique de Lausanne, repris en 2024 par un nouveau collectif." },
  { slug: "cinematheque-suisse", name: "Cinémathèque suisse", address: "Allée Ernest-Ansermet 3", postcode: "1003", city: "Lausanne" },
  { slug: "zinema", name: "Zinéma", address: "Rue du Maupas 4", postcode: "1002", city: "Lausanne" },
  { slug: "city-club", name: "CityClub Pully", address: "Avenue de Lavaux 36", postcode: "1009", city: "Pully" },
  { slug: "bellevaux", name: "Cinéma Bellevaux", address: "Route Aloys-Fauquez 4", postcode: "1018", city: "Lausanne" },
];

export type CollectiveSeed = { slug: string; name: string; scene: string; description: string };

export const COLLECTIVES: CollectiveSeed[] = [
  { slug: "collectif-52", name: "Collectif 52", scene: "électro", description: "Open airs avec Folklor, comme People In The City sur l'Esplanade du Château, et soirées hits des années 2000." },
  { slug: "club-francois", name: "Club François", scene: "électro", description: "Techno hypnotique et sombre, soirées au Romandie et au Heat à Sion." },
  { slug: "club-paillettes", name: "Club Paillettes", scene: "électro", description: "Anime la nuit lausannoise depuis 2022 avec des soirées house et techno joyeuses et accueillantes." },
  { slug: "la-main-mise", name: "La Main Mise", scene: "électro", description: "Fondé à Lausanne en 2015. Parti de la house, de l'italo et de la balearic, vers des sons plus hybrides et percussifs, du breakbeat à la UK bass en passant par la techno." },
  { slug: "la-recre", name: "La Récré", scene: "électro", description: "Collectif de passionné·es de house et de vinyles, qui mêle musique électronique et arts visuels comme le graffiti et le VJing." },
  { slug: "lcdb", name: "Les Copains d'aBord (LCDB)", scene: "électro", description: "Soirées au Folklor, parfois avec d'autres crews comme Les Enfants Terribles ou Sihl Records." },
  { slug: "133-kicks", name: "133 KICKS", scene: "électro", description: "Techno au Folklor, et une collab avec Mille4Samples à l'Exploria." },
  { slug: "technos-invasions", name: "Technos Invasions", scene: "électro", description: "Open air techno en plein cœur de Lausanne." },
  { slug: "attitude-nocturne", name: "Attitude Nocturne", scene: "électro", description: "Collectif historique de la scène house au MAD et au D!." },
  { slug: "4311-kollective", name: "4311 Kollective", scene: "queer, afro, inclusif", description: "Fondé en 2020, promeut les cultures queer underground, surtout la Ballroom Scene et les cultures queer POC : soirées, workshops, sonorités afro-descendantes." },
  { slug: "zagaza", name: "Zagaza", scene: "queer, afro, inclusif", description: "Laboratoire et collectif d'artistes afrodescendant·es de Suisse romande. Soirées house, vogue, hip-hop et disco." },
  { slug: "360-fever", name: "360° Fever", scene: "queer, afro, inclusif", description: "Soirées LGBTIQ+ de l'association 360 aux Docks. Tous les bénéfices vont aux activités sociales de l'association." },
  { slug: "merry-queersmas", name: "Merry QueerSmas", scene: "queer, afro, inclusif", description: "Association qui organise des soirées et des événements queer, notamment pendant la Pride." },
  { slug: "nouveau-cinematographe", name: "Collectif du nouveau Cinématographe", scene: "cinéma", description: "Nouvelle équipe qui a repris en mars 2024 la direction du Cinématographe." },
  { slug: "mets-tes-palmes", name: "Mets tes palmes", scene: "queer, féministe", description: "Collectif queer féministe romand qui édite une revue et fait des expositions d'archives." },
];

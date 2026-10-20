export interface WatchPreference {
  value: string;
  label: string;
  description: string;
  image: string;
}

export const WATCH_PREFERENCES: WatchPreference[] = [
  {
    value: "movies",
    label: "Movies",
    description: "Feature films and cinematic experiences",
    image: "/images/onboarding/icons/action.svg",
  },
  {
    value: "tv-shows",
    label: "TV Shows",
    description: "Series, episodes, and binge-worthy content",
    image: "/images/onboarding/icons/tv-shows.svg",
  },
  {
    value: "both",
    label: "Both",
    description: "The best of movies and television",
    image: "/images/onboarding/icons/both.jpg",
  },
];

export interface Genre {
  tmdbId: number;
  value: string;
  label: string;
  image: string;
}

export const GENRES: Genre[] = [
  {
    tmdbId: 28,
    value: "action",
    label: "Action",
    image: "/images/onboarding/icons/action.svg",
  },
  {
    tmdbId: 12,
    value: "adventure",
    label: "Adventure",
    image: "/images/onboarding/icons/adventure.svg",
  },
  {
    tmdbId: 16,
    value: "animation",
    label: "Animation",
    image: "/images/onboarding/icons/animaction.svg",
  },
  {
    tmdbId: 35,
    value: "comedy",
    label: "Comedy",
    image: "/images/onboarding/icons/comedy.svg",
  },
  {
    tmdbId: 80,
    value: "crime",
    label: "Crime",
    image: "/images/onboarding/icons/crime.svg",
  },
  {
    tmdbId: 99,
    value: "documentary",
    label: "Documentary",
    image: "/images/onboarding/icons/documentary.svg",
  },
  {
    tmdbId: 18,
    value: "drama",
    label: "Drama",
    image: "/images/onboarding/icons/drama.svg",
  },
  {
    tmdbId: 10751,
    value: "family",
    label: "Family",
    image: "/images/onboarding/icons/family.svg",
  },
  {
    tmdbId: 14,
    value: "fantasy",
    label: "Fantasy",
    image: "/images/onboarding/icons/fantasy.svg",
  },
  {
    tmdbId: 36,
    value: "history",
    label: "History",
    image: "/images/onboarding/icons/history.svg",
  },
  {
    tmdbId: 27,
    value: "horror",
    label: "Horror",
    image: "/images/onboarding/icons/horror.svg",
  },
  {
    tmdbId: 10402,
    value: "music",
    label: "Music",
    image: "/images/onboarding/icons/music.svg",
  },
  {
    tmdbId: 9648,
    value: "mystery",
    label: "Mystery",
    image: "/images/onboarding/icons/mistery.svg",
  },
  {
    tmdbId: 10749,
    value: "romance",
    label: "Romance",
    image: "/images/onboarding/icons/romance.svg",
  },
  {
    tmdbId: 878,
    value: "sci-fi",
    label: "Science Fiction",
    image: "/images/onboarding/icons/sci-fi.svg",
  },
  { tmdbId: 10770, value: "tv-movie", label: "TV Movie", image: "" },
  {
    tmdbId: 53,
    value: "thriller",
    label: "Thriller",
    image: "/images/onboarding/icons/thriller.svg",
  },
  {
    tmdbId: 10752,
    value: "war",
    label: "War",
    image: "/images/onboarding/icons/war.svg",
  },
  {
    tmdbId: 37,
    value: "western",
    label: "Western",
    image: "/images/onboarding/icons/western.svg",
  },
];

export const GENRES_BY_TMDB_ID: Record<number, Genre> = Object.fromEntries(
  GENRES.map((g) => [g.tmdbId, g]),
);

export interface WatchProvider {
  providerId: number;
  name: string;
  logo: string;
}

export const WATCH_PROVIDERS: WatchProvider[] = [
  {
    providerId: 8,
    name: "Netflix",
    logo: "https://image.tmdb.org/t/p/original/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg",
  },
  {
    providerId: 119,
    name: "Prime Video",
    logo: "https://image.tmdb.org/t/p/original/pvske1MyAoymrs5bguRfVqYiM9a.jpg",
  },
  {
    providerId: 337,
    name: "Disney+",
    logo: "https://image.tmdb.org/t/p/original/97yvRBw1GzX7fXprcF80er19ot.jpg",
  },
  {
    providerId: 384,
    name: "HBO Max",
    logo: "https://image.tmdb.org/t/p/original/3Sx0c7sNk0JSA1yhbXbP9wYzDRU.jpg",
  },
  {
    providerId: 15,
    name: "Hulu",
    logo: "https://image.tmdb.org/t/p/original/giwM8d4WzP9RkCL22oMPBoDTgDf.jpg",
  },
  {
    providerId: 350,
    name: "Apple TV",
    logo: "https://image.tmdb.org/t/p/original/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg",
  },
  {
    providerId: 531,
    name: "Paramount+",
    logo: "https://image.tmdb.org/t/p/original/fX5d8sAlTEs4ysnKqnwlDVHTBGh.jpg",
  },
  {
    providerId: 2336,
    name: "JioHotstar",
    logo: "https://image.tmdb.org/t/p/original/kVqjgpcwvDJOhCupjcLzwwtOp52.jpg",
  },
  {
    providerId: 1899,
    name: "Max",
    logo: "https://image.tmdb.org/t/p/original/fqFkImEnD17uUwpYNNeSF6WkA3T.jpg",
  },
  {
    providerId: 1773,
    name: "SkyShowtime",
    logo: "https://image.tmdb.org/t/p/original/h0ZYcYHicKQ4Ixm5nOjqvwni5NG.jpg",
  },
  {
    providerId: 538,
    name: "Plex",
    logo: "https://image.tmdb.org/t/p/original/vLZKlXUNDcZR7ilvfY9Wr9k80FZ.jpg",
  },
  {
    providerId: 3,
    name: "Google Play Movies",
    logo: "https://image.tmdb.org/t/p/original/8z7rC8uIDaTM91X0ZfkRf04ydj2.jpg",
  },
  {
    providerId: 35,
    name: "Rakuten TV",
    logo: "https://image.tmdb.org/t/p/original/bZvc9dXrXNly7cA0V4D9pR8yJwm.jpg",
  },
  {
    providerId: 2241,
    name: "Movistar Plus+",
    logo: "https://image.tmdb.org/t/p/original/jse4MOi92Jgetym7nbXFZZBI6LK.jpg",
  },
  {
    providerId: 167,
    name: "Crunchyroll",
    logo: "https://image.tmdb.org/t/p/original/7PNcWH4LIUFNlhSWsLvtPUtdMEb.jpg",
  },
  {
    providerId: 283,
    name: "Crunchyroll Amazon Channel",
    logo: "https://image.tmdb.org/t/p/original/omghMP3R1e7lK3njzTjXzJznQKu.jpg",
  },
  {
    providerId: 298,
    name: "RTL+",
    logo: "https://image.tmdb.org/t/p/original/jmR0t1kjzHcyV7raynzMbF87J9d.jpg",
  },
  {
    providerId: 433,
    name: "Pantaflix",
    logo: "https://image.tmdb.org/t/p/original/4I1Y2E4ZJCKMc5SHkSagebjB0wL.jpg",
  },
  {
    providerId: 323,
    name: "Yle Areena",
    logo: "https://image.tmdb.org/t/p/original/nrORhu39C2YjBhx9v8rU8oFlulj.jpg",
  },
  {
    providerId: 436,
    name: "Fetch TV",
    logo: "https://image.tmdb.org/t/p/original/9B7l9ZSos54kFrZbliVExt2z9C9.jpg",
  },
  {
    providerId: 342,
    name: "puhutv",
    logo: "https://image.tmdb.org/t/p/original/ffvIywFtojPQnVwHVmTSZEdemdt.jpg",
  },
  {
    providerId: 160,
    name: "iflix",
    logo: "https://image.tmdb.org/t/p/original/vCTY2WtY1oJ8EKpp0UCz4SRpE4S.jpg",
  },
  {
    providerId: 150,
    name: "blue TV",
    logo: "https://image.tmdb.org/t/p/original/47klot430ytIqldQUUx2avN45Sr.jpg",
  },
  {
    providerId: 232,
    name: "Zee5",
    logo: "https://image.tmdb.org/t/p/original/gP67NRy1ShUJilrzMsbOmEmdmcv.jpg",
  },
  {
    providerId: 309,
    name: "Sun Nxt",
    logo: "https://image.tmdb.org/t/p/original/6KEQzITx2RrCAQt5Nw9WrL1OI8z.jpg",
  },
];

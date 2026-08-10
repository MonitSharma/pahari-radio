import type { GlossaryEntry } from '../src/lib/types.ts'

/**
 * The curated seed. This is the file you edit to change what plays.
 *
 * Only `id` is required. `title`/`artist` override YouTube's own metadata,
 * which is usually buried under "| Latest Himachali Pahari Song 2025 | Full HD".
 * Everything else feeds the "about this song" panel and can be filled in over
 * time — a track with no editorial still plays fine.
 *
 * After editing, run `npm run build:stations` to re-verify and re-fetch covers.
 */
export interface SeedTrack {
  id: string
  title?: string
  artist?: string
  dialect?: string
  region?: string
  occasion?: string
  note?: string
  glossary?: GlossaryEntry[]
}

export interface SeedStation {
  slug: string
  name: string
  roman: string
  tagline: string
  epoch: number
  entries: SeedTrack[]
}

// Stations are offset from one another so they don't all change track on the
// same second — it just feels better when you're flipping between them.
const E = (offsetMin: number) => Date.UTC(2024, 0, 1, 0, offsetMin, 0)

const g = (word: string, roman: string, meaning: string): GlossaryEntry => ({ word, roman, meaning })

// Words that recur across the whole repertoire, worth defining once.
const GORIYE = g('गोरिये', 'goriye', 'fair one — a common way of addressing a woman in song')
const NATI = g('नाटी', 'nati', "Himachal's circular group dance, and the songs written for it")
const DEVTA = g('देवता', 'devta', 'the village deity, carried in a palanquin at fairs')
const JATAR = g('जातर', 'jatar', 'a village fair held in a deity’s honour')
const DHOLA = g('ढोला', 'dhola', 'beloved — the standard term of endearment in Kangri and Gaddi song')

const withEditorial = (ids: string[], editorial: Pick<SeedTrack, 'dialect' | 'region' | 'occasion'>): SeedTrack[] =>
  ids.map((id) => ({ id, ...editorial }))

// Additional candidates are intentionally kept as IDs only. The build step
// fetches the current YouTube title, artist, duration and embed availability,
// dropping anything that has gone bad before it reaches the station JSON.
const EXTRA_NATI = [
  'r7r8TMybbwg', '_QnHG60GNoU', 'oifWpw-oroE', 'UVTTgDrXB1Y', '8Ge5uj504Cg',
  'y73vyGmM7bY', 'MtSU4xaPmgw', '6vt_0YAEga0', '2--qQmnmDEQ', 'QhUkAtTaBCs',
  'siQFihyg50s', 'LWzeZHJR-i0', 'GZ8jlAdNOQI', 'AI4Sh9S5b6w', 'aK9Ud1q25nQ',
  'uEddXNIPYF0', '_0wisk0pZVo', 'r30wDNC-7sM', 'scZCP9PKmO4', 'K-e982ytZMQ',
  '0lm5W04Gnfg', 'lQrAz87f7nA', 'yKW9Ir4eX8I', 'I-4LiPfwTHo', 'E7jWCt7l6Fo',
  'Euy8pDRDUew', 'tyKySIdI2xg', 'OXpk6DrkMnU', 'SXcHRWgA9tI', 'zdtZEPLdPfU',
  'uV_O3kCozq4', 'DaWU5C1ncSo', 'dOheZ_dt0bk',
]

const EXTRA_KULLVI = [
  'raori1xBCJ0', 'yNzLXjwiDQ4', 'J-1EgMWHFL4', 'FmWLV2wDdhU', '3HsJBC5Yq5I',
  'I8mPjB9gKVo', 'fdfFnw8wlew', 'idlCWwvhM5I', 'h4OlgzjxNaY', 'Mete1QL4EQc',
  'HfS7xRM61gk', 'jsOuIs_qM4k', 'PPHSoHYdNi0', 'swQIJKFD2Ao', '1CI1Cu2Hr5M',
  'j6UDXC9hMUY', '0atfoP-Swsw', 'PVQBWoV0dRQ', 'Sb9VxIQ0ki4', '9HsAoM_aVHw',
  'A8mZmCzfms4', 'RQJT4aiCJx8', 'aZ6_-0AGpzI', '78ASaO5LPww', 'Go4NQpaLGJI',
  '7Pnx-GwbJ-4', 'pPXFn3HH7fU', '2Oxu3bCRwIY', 'hWU8QiXpHps', 'f57WasySB_g',
  'UJWxgFSWxCs', 'gictpIaaZtY', 'jFwYjn1v3ys', '2QqNiQ73Gjs', '614vmA9kIhI',
  'Ma_ocSuk8yI',
]

const EXTRA_KANGRI = [
  'gdPogbxT4os', 'rbpDXS3HvX4', 'bntfCwt8q1U', 'pCVilTaUKVk', 'JAZ5-RIFVUc',
  'NEcPATE9hvs', 'h3a65rAUkC4', 'vX6V-ryFhsI', '9vCcPdCiLVI', 'Bes9x4ZaqJA',
  'ONA7U8HmC3g', 'NwbfxLZko9c', '-3RvBMMUS6c', 'uJh7JLRMlBk', 's0LVR37iZrQ',
  'Nsy3U7Au5_E', 'vhYF8O0serY', 'eULJHcTcaMU', 'SPSwGJ81los', '5oroSuXHGbY',
  'P0xeMFCvz_w', '5a-9Jn6KiGY', 'b-u9qaYQ_Iw', 'tNIN5guTUok', '9LyK8377bT4',
  '3u_cS7oqyxA', '_FS3lxs_y3s', '_brCwNoFqBk', 'vZgkTrC0fKE', 'SSHcheV4R3o',
  'sT3vXeklTfI',
]

const EXTRA_CHAMBA = [
  'b3YVacONARY', 'GkhrOnaLFVY', 'V0tLmW9T1pc', 'LgdzqTrXxVg', 'SKqkrPdRW5U',
  'vY4PCOYdM5o', 'cl7B4jixnVo', 'vY0CKn9bCec', 'JRaWIbOMtPI', 'DXEjdHtJTEk',
  'Mcp8i2-Cu_c', '4JPZTuj8jNs', 'U63gXpzSzsE', 'nOPbesX1YH0', 'RTUcctTvYgE',
  'GtV99EUKMLM', 'LISP3lNQYSU', '0MoaiU4KXac', '_Nrdl7qdGnA', '27yGHM5TwNI',
  's1Ht1RWxiyA', 'Ia1wdTzdEzU', 'fXQiNDeRd74', 'DvJV7e1EMq0', 'QglvhFrcjSA',
  '7T2i73X2_Ns', 'SAiNsfeWVbI', 'YSGrr5HIT6c', 'MAGuo3gsNlI', 'iosspmqOUYI',
  '8BFP01yfatQ', 'EYXtNRYIjr0', 'KX4DcsnBxYI',
]

const EXTRA_DEVBHOOMI = [
  'BmD0GYKXaTc', '9uT4M05Hckc', 'X5CEJAT8vOc', 'Ol_iAYD5ATs', 'j_zda_xdkiQ',
  'P2L7tqe6CYQ', 'y_oTUZER90o', '8jNkP3JUF0M', 'KTAgI5YrE24', 'O9HKhcjSodQ',
  'CsF-w3MUeuQ', 'm-pflPUS16I', 'TDtMkyZu8S8', 'qtMhWck5o3k', 'I8rey2YgGyc',
  'x015EEnOApE', 'LuIeBLPfrwI', 'YwF20zhUPgA', 'GH1sqvKwCT4', 'hFZ7leT1MIk',
  't1t8jJlBCzQ', 'hq9mii5xbhk', 'h7GUR-9V5CA', 'ZGAxvYPt-CU', 'lXQe7uOVXzU',
  'uYUUf7jqM1w', 'xUB9hX0HHsE', '9Zgy9e-1PsI', '-tVOkL0FsQw', 'hxQSwuqxbSI',
  'hg9hTfx6g5g', 'SZu8iIdunJg', 'OrEctMex2JE', 'NPlNZngvZH4', 'KqV1bbZfePA',
  'raXm6ftA2c4',
]

export const seed: SeedStation[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'nati',
    name: 'नाटी घर',
    roman: 'Nati Ghar',
    tagline: 'The dance floor. Shimla-belt nati, loud and modern.',
    epoch: E(0),
    entries: [
      {
        id: 'iEaxxfS_5SA',
        title: 'Rohru Jana Meri Amiye',
        artist: 'Kuldeep Sharma',
        dialect: 'Mahasuvi',
        region: 'Rohru, Shimla district',
        occasion: 'Nati',
        note: 'Kuldeep Sharma is called the Nati King, and this is the register he made his own: a plain conversational line — a child telling their mother they are off to Rohru — carried on a beat built for a circle of dancers rather than a stage.',
        glossary: [
          g('अमिये', 'amiye', 'mother, in the dialect of upper Shimla'),
          g('रोहड़ू', 'Rohru', 'a town on the Pabbar river in Shimla district'),
          NATI,
        ],
      },
      {
        id: 'DjuLD6ogH7I',
        title: 'O Nilima',
        artist: 'Kuldeep Sharma',
        dialect: 'Mahasuvi',
        region: 'Shimla hills',
        occasion: 'Nati',
        note: 'One of the songs that carried Himachali folk out of the fairground and onto cassette. Naming a woman in the title and repeating it as a hook is a Kuldeep Sharma signature — several of his best-known natis are built exactly this way.',
        glossary: [NATI],
      },
      {
        id: '-D71HfgY9To',
        title: 'Rumatiye',
        artist: 'Kuldeep Sharma',
        dialect: 'Mahasuvi',
        region: 'Shimla hills',
        occasion: 'Nati',
        note: 'Later-period Kuldeep Sharma, with studio production layered over the traditional nati step. The tempo still resolves to the same slow-fast dance cycle a nati circle expects.',
        glossary: [NATI],
      },
      {
        id: 'jmNg0LkQazI',
        title: 'Meri Jani Ra Basera',
        artist: 'Kuldeep Sharma',
        dialect: 'Mahasuvi',
        region: 'Shimla hills',
        occasion: 'Nati',
      },
      {
        id: 'YZmwJtM_AmA',
        title: 'MG Hector Car Beeniya',
        artist: 'Kuldeep Sharma',
        dialect: 'Mahasuvi',
        region: 'Shimla hills',
        occasion: 'Wedding nati',
        note: 'A good example of how alive this tradition is: the wedding song has always catalogued what the groom brings, so a current SUV model simply takes the place a horse or a jeep held in earlier versions.',
        glossary: [g('बीणिये', 'beeniya', 'bride')],
      },
      {
        id: 'PjaID-Grui4',
        title: 'Meta Mahare Kishori Lala',
        artist: 'KL Singta',
        dialect: 'Pahari (Shimla belt)',
        region: 'Shimla district',
        occasion: 'Nati',
        note: 'KL Singta records prolifically for the Shimla nati circuit, where a song’s life is measured in how many fairs it survives rather than in chart positions.',
        glossary: [NATI],
      },
      {
        id: 'UICQHNna-as',
        title: 'Babua Jai Rama',
        artist: 'KL Singta',
        dialect: 'Pahari (Shimla belt)',
        region: 'Shimla district',
        occasion: 'Traditional nati',
        note: 'Marked as traditional rather than newly written — the melody predates the recording, which is common in this repertoire.',
        glossary: [NATI],
      },
      { id: 'wdDFEfcTdfA', title: 'Hy Payari Sapna', artist: 'KL Singta', dialect: 'Pahari (Shimla belt)', occasion: 'Nati' },
      { id: 'j3fFU6ixBSo', title: 'Badmashi', artist: 'KL Singta', dialect: 'Pahari (Shimla belt)', occasion: 'Nati' },
      { id: 'dkrwXFJNWcs', title: 'Ronko Bazaro Di', artist: 'KL Singta ft. Divya', dialect: 'Pahari (Shimla belt)', occasion: 'Nati' },
      {
        id: 'tBt_rGvGA3g',
        title: 'Bawri Jhuriye',
        artist: 'Hemraj Khachi',
        dialect: 'Pahari (Shimla belt)',
        occasion: 'Nati',
        glossary: [g('झूरी', 'jhuri', 'a young woman; in song, the one being addressed')],
      },
      { id: 'fOI-MsoyVUg', title: 'Ho Sumitra', artist: 'Hemraj Khachi', dialect: 'Pahari (Shimla belt)', occasion: 'Nati' },
      { id: 'X5piimKhS9M', title: 'Jhumi Jhumiyo', artist: 'Hemraj Khachi', dialect: 'Pahari (Shimla belt)', occasion: 'Nati' },
      { id: '-qHNpIu_zyg', title: 'Sawan Re Mahine Di', artist: 'Hemraj Khachi', dialect: 'Pahari (Shimla belt)', occasion: 'Monsoon song', note: 'Sawan, the monsoon month, is the single most-sung season in Himachali folk — the rains, the swings hung in the trees, and the daughters who come home for them.' },
      {
        id: 'R2FmdiCn9VA',
        title: 'LP Gadi',
        artist: 'Vicky Chauhan & Geeta Bhardwaj',
        dialect: 'Pahari (Shimla belt)',
        occasion: 'Nati',
        note: 'A duet in the call-and-response shape nati borrows from older fairground singing, where two singers trade verses across the circle.',
      },
      { id: '3wQRbv-IBi0', title: 'Kindi Chale Bathade', artist: 'Vicky Chauhan', dialect: 'Pahari (Shimla belt)', occasion: 'Nati' },
      { id: 'wktAkRii0wM', title: 'Kosi Ri Boniyo Ji', artist: 'Vicky Chauhan', dialect: 'Pahari (Shimla belt)', occasion: 'Nati' },
      { id: 'PM53n-eFW2Q', title: 'Jhumke Jhumke', artist: 'Vicky Chauhan', dialect: 'Pahari (Shimla belt)', occasion: 'Nati' },
      { id: 'JG3KXJYvNGM', title: 'Cham Chamande Ho', artist: 'Vicky Chauhan', dialect: 'Pahari (Shimla belt)', occasion: 'Nati' },
      { id: '4jDHBaWutqQ', title: 'Whisky Whisky', artist: 'Vicky Chauhan & Rajeev Negi', dialect: 'Pahari (Shimla belt)', occasion: 'DJ nati', note: 'The contemporary end of the scene, where nati is produced for sound systems at weddings. The step underneath is unchanged; the drums are not.' },
      { id: '00lfigkK4w0', title: 'Suno Mem Saheb Ji', artist: 'Vicky Chauhan', dialect: 'Pahari (Shimla belt)', occasion: 'DJ nati' },
      { id: 'D1TLPtdfH3s', title: 'Naati Ra Dhamaka', artist: 'Ishant Bhardwaj', dialect: 'Pahari (Shimla belt)', occasion: 'DJ nati', glossary: [NATI] },
      { id: 'DY-sLVAZDcM', title: 'Kudmanua', artist: 'Ishant Bhardwaj', dialect: 'Pahari (Shimla belt)', occasion: 'DJ nati' },
      ...withEditorial(EXTRA_NATI, { dialect: 'Pahari (Shimla belt)', region: 'Shimla district', occasion: 'Nati' }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'kullvi',
    name: 'कुल्लवी',
    roman: 'Kullvi',
    tagline: 'Kullu valley. Slower, older, sung in Kullvi.',
    epoch: E(7),
    entries: [
      {
        id: 'rbCJz2WFKCw',
        title: 'Balh Ri Kanak',
        artist: 'Inderjeet',
        dialect: 'Kullvi',
        region: 'Kullu / Balh valley, Mandi',
        occasion: 'Traditional nati',
        note: 'Named for the wheat of the Balh valley — the flat, fertile stretch below Mandi that is unusual enough in a vertical landscape to have become shorthand for plenty.',
        glossary: [
          g('बाल्ह', 'Balh', 'the broad valley floor south of Mandi'),
          g('कणक', 'kanak', 'wheat'),
          NATI,
        ],
      },
      {
        id: 'Sx1F2sWKYlo',
        title: 'Indru Indra',
        artist: 'Inderjeet & Charu Sharma',
        dialect: 'Kullvi',
        region: 'Kullu',
        note: 'Inderjeet and Charu Sharma record as a pair often enough that the two-voice texture has become part of the modern Kullvi sound.',
      },
      {
        id: 'AstnhOMWDoo',
        title: 'Ladi Shaauni 3',
        artist: 'Inderjeet ft. Sapna Chauhan',
        dialect: 'Kullvi',
        region: 'Kullu',
        occasion: 'Wedding',
        note: 'The third instalment of Inderjeet’s best-known song — sequels are a real and unembarrassed genre here, released whenever the first one refuses to die at weddings.',
        glossary: [g('लाड़ी', 'ladi', 'bride')],
      },
      { id: 'oU1wodcNRrM', title: 'Pakhli Manu', artist: 'Inderjeet & Kajal Sharma', dialect: 'Kullvi', region: 'Kullu' },
      { id: 'oo9NrSAnmq0', title: 'Meera', artist: 'Inderjeet & Charu Sharma', dialect: 'Kullvi', region: 'Kullu' },
      { id: 'LjAuTnzAQrc', title: 'Udi Udi Ja', artist: 'Inderjeet & Charu Sharma', dialect: 'Kullvi', region: 'Kullu' },
      { id: 'ptdSE_qo4XA', title: 'Tharah Kardu', artist: 'Inderjeet', dialect: 'Kullvi', region: 'Kullu', occasion: 'Traditional' },
      { id: 'q_j1v1jMFTQ', title: 'Mhare Bishuye Jana', artist: 'Inderjeet & Surender Negi', dialect: 'Kullvi', region: 'Kullu' },
      { id: 'X6LLJTEPhcI', title: 'Solma', artist: 'Inderjeet & Charu Sharma', dialect: 'Kullvi', region: 'Kullu' },
      { id: '2IURNO88fjk', title: 'Lumbru', artist: 'Inderjeet', dialect: 'Kullvi', region: 'Kullu' },
      {
        id: 'qO9ctw5yF9I',
        title: 'Himachali Tappe',
        artist: 'Inderjeet & Charu Sharma ft. Promila Thakur',
        dialect: 'Kullvi',
        region: 'Kullu',
        occasion: 'Tappe',
        note: 'Tappe are short paired couplets, traded back and forth — closer to competitive banter than to a composed song, and the form where a singer’s wit matters more than their range.',
        glossary: [g('टप्पे', 'tappe', 'short rhyming couplets sung in alternation')],
      },
      { id: 'jAArMoY2ico', title: 'Maharaz', artist: 'Inder Jeet', dialect: 'Kullvi', region: 'Kullu', occasion: 'Traditional nati' },
      { id: 'TDhgqYvxHxI', title: 'Bangdiyan', artist: 'Sunil Mastie & Sheetal Arora', dialect: 'Kullvi', region: 'Kullu', glossary: [g('बंगड़ियां', 'bangdiyan', 'bangles')] },
      { id: 'gNmK2uzC4_4', title: 'Kullu Valley Folk Vibes', artist: 'AarushBeats', dialect: 'Kullvi', region: 'Kullu', occasion: 'Instrumental / fusion' },
      ...withEditorial(EXTRA_KULLVI, { dialect: 'Kullvi', region: 'Kullu valley', occasion: 'Folk / nati' }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'kangri',
    name: 'कांगड़ी लोक',
    roman: 'Kangri Lok',
    tagline: 'Lower Himachal. Karnail Rana and the Kangra valley.',
    epoch: E(13),
    entries: [
      {
        id: 'BnhX8TUhMyY',
        title: 'Saile Simble Ni Maaye',
        artist: 'Karnail Rana',
        dialect: 'Kangri',
        region: 'Kangra valley',
        note: 'Karnail Rana has recorded well over a thousand songs across some 250 albums and is the reason Kangri folk kept a mass audience through the cassette and CD eras. He is widely called the Lok Ratna of Himachal.',
      },
      {
        id: 'N2EtWJWSFnA',
        title: 'Adhi Raati Kuku Bolda',
        artist: 'Karnail Rana',
        dialect: 'Kangri',
        region: 'Kangra valley',
        note: 'The cuckoo calling at midnight is one of the oldest images in Pahari song — a bird heard but not seen, standing in for someone absent.',
        glossary: [g('कुकू', 'kuku', 'the cuckoo, whose call marks spring and, in song, longing')],
      },
      { id: 'OETPvTSGuLI', title: 'Putt Thakuran De', artist: 'Karnail Rana', dialect: 'Kangri', region: 'Kangra valley' },
      { id: 'ty4qlOY9tLk', title: 'Ratno Ni Sun Ratno', artist: 'Karnail Rana', dialect: 'Kangri', region: 'Kangra valley' },
      {
        id: '3tixelwSGZw',
        title: 'Mandran Ch Hove Meri Maa',
        artist: 'Karnail Rana',
        dialect: 'Kangri',
        region: 'Kangra valley',
        occasion: 'Devotional',
        note: 'Kangra’s folk and devotional repertoires are not cleanly separable — the same singers, the same melodies, and often the same fairs.',
      },
      { id: '2qzKVK2foXM', title: 'Chite Ne Rolti Jawani', artist: 'Karnail Rana', dialect: 'Kangri', region: 'Kangra valley' },
      { id: '5_PUVPTjMmE', title: 'Badeyan Gharan Di Goriye', artist: 'Karnail Rana & Rajni Bhatia', dialect: 'Kangri', region: 'Kangra valley', glossary: [GORIYE] },
      {
        id: 'S7EZ7S65XDo',
        title: 'Hansi Hansi Poochdi Wo Rani Rukmani',
        artist: 'Karnail Rana',
        dialect: 'Kangri',
        region: 'Kangra valley',
        occasion: 'Narrative song',
        note: 'A narrative song built on the Rukmini story. Long-form storytelling like this is the older layer of the repertoire, from before songs were cut to a three-minute length.',
      },
      { id: 'XTh_drXsoRQ', title: 'Gharan Diyan Biyan', artist: 'Karnail Rana', dialect: 'Kangri', region: 'Kangra valley', occasion: 'Wedding' },
      {
        id: 'SqlKhK5Fx1c',
        title: 'Kangri Mashup',
        artist: 'Karnail Rana',
        dialect: 'Kangri',
        region: 'Kangra valley',
        note: 'A run through several Kangri melodies in one take — a useful thing to hear early, because it shows how much of the repertoire shares a common backbone.',
      },
      { id: 'dU8tZG6RQSU', title: 'Jaliye Buni Liya Jaal', artist: 'TrioMusic Kangra', dialect: 'Kangri', region: 'Kangra valley' },
      { id: 'GCg1sViClYw', title: 'Zindagi Sohni Aee', artist: 'Bishan Dass', dialect: 'Dogri / Kangri', region: 'Lower Himachal', note: 'Kangri shades into Dogri as you move west towards Jammu, and singers on that border move between the two without much ceremony.', glossary: [DHOLA] },
      ...withEditorial(EXTRA_KANGRI, { dialect: 'Kangri', region: 'Kangra valley', occasion: 'Folk song' }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'chamba',
    name: 'चंबा–पांगी',
    roman: 'Chamba–Pangi',
    tagline: 'Gaddi, Churahi and Pangwali, from the far side of the passes.',
    epoch: E(19),
    entries: [
      {
        id: 'NoK2uvbX0Ng',
        title: 'Pangi Churah 2.0',
        artist: 'Poonam Bhardwaj',
        dialect: 'Pangwali / Churahi',
        region: 'Pangi and Churah valleys, Chamba',
        note: 'Poonam Bhardwaj is the best-known voice from this corner of Himachal. Pangi sits beyond the Sach Pass and is cut off by snow for months a year, which is part of why its music sounds least like everything else in the state.',
      },
      {
        id: 'qetuAm_WQjc',
        title: 'Zindadi',
        artist: 'Poonam Bhardwaj',
        dialect: 'Gaddi',
        region: 'Bharmour, Chamba',
        note: 'Gaddi song belongs to a shepherding people who move flocks between Kangra and the high Bharmour pastures — a seasonal migration that shows up constantly in the lyrics as departure and return.',
        glossary: [DHOLA],
      },
      { id: 'JyuS8jrgRI0', title: 'Churahi Natti', artist: 'Poonam Bhardwaj & RK Soni', dialect: 'Churahi', region: 'Churah valley, Chamba', occasion: 'Nati', glossary: [NATI] },
      { id: 'AfbNlGVXUtk', title: 'O Dhola', artist: 'Poonam Bhardwaj & Aman Bharmouri', dialect: 'Gaddi', region: 'Bharmour, Chamba', glossary: [DHOLA] },
      { id: 'RlltJJA5-Ds', title: 'Chann Chadeya', artist: 'Poonam Bhardwaj', dialect: 'Gaddi', region: 'Chamba' },
      { id: 't5rjnfhb588', title: 'Gaddiyali Folk Naati', artist: 'Poonam Bhardwaj', dialect: 'Gaddi', region: 'Bharmour, Chamba', occasion: 'Nati' },
      { id: 'dElCNixCuJw', title: 'Gudak Chamak', artist: 'Poonam Bhardwaj', dialect: 'Chambyali', region: 'Chamba' },
      { id: 'G-mz0IG6_DI', title: 'Hey Tulso', artist: 'Poonam Bhardwaj', dialect: 'Chambyali', region: 'Chamba' },
      { id: 'ilIEfAeglJI', title: 'Pangi Beats', artist: 'Poonam Bhardwaj', dialect: 'Pangwali', region: 'Pangi valley, Chamba' },
      {
        id: '2Fv0av0Ns2k',
        title: 'Pangwali Folk Song',
        artist: 'M K Chipna & Devi Singh',
        dialect: 'Pangwali',
        region: 'Pangi valley, Chamba',
        note: 'Pangwali is spoken by a few thousand people in one valley. Recordings like this are a meaningful share of everything ever committed to tape in the language.',
      },
      { id: 'rFGa9uzGPyA', title: 'Tero Mero Sath', artist: 'Sunil Lugupa & Yogi Chauhan', dialect: 'Pangwali', region: 'Pangi valley, Chamba' },
      { id: 'gCISW87bkbU', title: 'Aaja Mere Saajna', artist: 'Pangwali Chamba Folk', dialect: 'Pangwali', region: 'Pangi valley, Chamba', occasion: 'Traditional' },
      { id: 'ArlxtFRM4bE', title: 'Nach Bala Bhotiryo', artist: 'Pangwali Chamba Folk', dialect: 'Pangwali', region: 'Pangi valley, Chamba', occasion: 'Traditional' },
      { id: '4VVQQQx8W4Q', title: 'Piyoka Hilltown', artist: 'Pangwali Chamba Folk', dialect: 'Pangwali', region: 'Pangi valley, Chamba', occasion: 'Traditional' },
      { id: 'jZmCMmF_Ot0', title: 'Haira Logo Pangi Ree Shaan', artist: 'Pangwali Chamba Folk', dialect: 'Pangwali', region: 'Pangi valley, Chamba', occasion: 'Traditional' },
      {
        id: 'v8Qa61XJ7yQ',
        title: 'Sunni Bhunku',
        artist: 'Onkar Thakur',
        dialect: 'Gaddi',
        region: 'Chamba / Kangra',
        occasion: 'Shepherd song',
        note: 'Explicitly a tribute to the shepherds. The Gaddi flock routes are emptying as the younger generation leaves them, and a fair amount of recent Gaddi music is elegy whether or not it says so.',
      },
      ...withEditorial(EXTRA_CHAMBA, { dialect: 'Gaddi / Pangwali / Chambyali', region: 'Chamba and Pangi', occasion: 'Folk song' }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'devbhoomi',
    name: 'देवभूमि',
    roman: 'Devbhoomi',
    tagline: 'For the deities. Harul, dev nati and the Mata bhajans.',
    epoch: E(26),
    entries: [
      {
        id: 'GoCCKWAzv7s',
        title: 'Chatradhari',
        artist: 'Harul — Chalda Mahasu',
        dialect: 'Trans-Giri / Jaunsari',
        region: 'Sirmaur and the Mahasu belt',
        occasion: 'Harul',
        note: 'Harul is the ballad form of the trans-Giri country, sung for Mahasu Devta. Chalda Mahasu is the "moving" one of the four Mahasu brothers, whose image travels between villages on a years-long circuit rather than staying in one temple.',
        glossary: [
          g('हारुल', 'harul', 'the long ballad form of the Mahasu belt'),
          g('छत्रधारी', 'chatradhari', 'bearer of the canopy — an epithet for the deity'),
          DEVTA,
        ],
      },
      {
        id: 'ymqfjp_TOww',
        title: 'Jai Jai Mahasu Deva',
        artist: 'Ajay Chauhan',
        dialect: 'Sirmauri',
        region: 'Sirmaur',
        occasion: 'Devotional',
        glossary: [DEVTA, JATAR],
      },
      { id: 'bxzYwDay_UU', title: 'Jai Deva Mahasu Chalda', artist: 'Bahadur Singh Rana', dialect: 'Sirmauri / Jaunsari', region: 'Mahasu belt', occasion: 'Devotional' },
      { id: 'ubA2IQh0igg', title: 'Mahasu Devta Harul 2', artist: 'Mukesh Kohli & Kavita Rawat', dialect: 'Jaunsari', region: 'Mahasu belt', occasion: 'Harul' },
      {
        id: 'yLwdiZ4aMzA',
        title: 'Kangde Da Tilla O Mata',
        artist: 'Karnail Rana',
        dialect: 'Kangri',
        region: 'Kangra',
        occasion: 'Mata bhajan',
        note: 'The single most-recorded devotional song in lower Himachal — the "hill of Kangra" is the shrine at Brajeshwari, and near enough every Kangri singer has cut a version.',
        glossary: [g('टीला', 'tila', 'hill or mound; here, the temple hill at Kangra')],
      },
      { id: 'MEB2WRDfan8', title: 'Kangre Da Teela O Mata', artist: 'Sumna Himachali', dialect: 'Kangri', region: 'Kangra', occasion: 'Mata bhajan', note: 'A second reading of the same song, a generation on — worth hearing back to back with Karnail Rana’s.' },
      { id: 'RIzv-Ar0gt8', title: 'Pahadan Diye Raniye', artist: 'Aman Bharmouri', dialect: 'Gaddi', region: 'Bharmour, Chamba', occasion: 'Bhajan', glossary: [g('पहाड़ां दिये राणिये', 'pahadan diye raniye', 'queen of the mountains — the goddess')] },
      { id: 'QiGtz8k-2jE', title: 'Yashoda Tera Kanheya', artist: 'Poonam Bhardwaj', dialect: 'Pahari', region: 'Chamba', occasion: 'Bhajan' },
      { id: 'XRcwNvzJXi4', title: 'Main Jab Bhi Pukaru Maa', artist: 'Mahakali Musical Group', dialect: 'Hindi / Pahari', occasion: 'Bhajan' },
      { id: '8qavbOUSm6o', title: 'Poudiyan Chad Gya Dati Ji', artist: 'Himachali Arvind', dialect: 'Kangri', region: 'Kangra', occasion: 'Mata bhajan' },
      { id: '5q7wgl0GcJI', title: 'Hoya Supna', artist: 'Kumar Bakshi', dialect: 'Dogri / Pahari', occasion: 'Chandi Mata bhajan' },
      { id: 'RtC4zLlIv34', title: 'Bhagta Ander Jot Jagdi', artist: 'Himachali Munda', dialect: 'Kangri', occasion: 'Navratri bhajan', note: 'Navratri is when this repertoire is most alive — jagratas run through the night and the same songs are sung until dawn.' },
      { id: 'DNRrzXyINzc', title: 'Fulan Di Kyariyan Ch Rendi Meri Maa', artist: 'Himachali Munda', dialect: 'Kangri', occasion: 'Mata bhajan' },
      { id: '4qlsGim5J1E', title: 'Maa Mandir Tera Badi Door', artist: 'Mahakali Musical Group', dialect: 'Hindi / Pahari', occasion: 'Bhajan' },
      ...withEditorial(EXTRA_DEVBHOOMI, { dialect: 'Pahari / Jaunsari', region: 'Himachal and Mahasu belt', occasion: 'Devotional / harul' }),
    ],
  },
]

import type { Meetup, JournalArticle, ReaderStory, GalleryItem, Enquiry } from '../types';

export const initialMeetups: Meetup[] = [
  {
    id: 'meetup-upcoming-1',
    title: 'The Sunday Open Chapter: Silence, Sunlight & Stories',
    edition: 'Chapter 14',
    date: 'Sunday, November 15, 2026',
    time: '8:30 AM – 11:00 AM IST',
    venue: 'Siddharth Garden / Historic Grounds',
    address: 'Near Central Bus Stand, Aurangabad, Maharashtra',
    description: 'Bring a book of your choice—fiction, non-fiction, poetry, or regional literature in any language. We begin with 60 minutes of silent reading under the morning shade, followed by coffee and voluntary reflections.',
    featuredImage: '/images/hero/roa-009-2026-11-05.jpg',
    registrationUrl: 'https://forms.gle/readers-of-aurangabad-ch14',
    registrationStatus: 'open',
    capacity: 'Open to all readers',
    activities: [
      '60 Minutes Silent Reading',
      'Informal Reader Introductions',
      'Book Recommendations & Swap',
      'Open Conversation on Literature & Life'
    ],
    highlights: 'Please carry a personal reading mat or towel, a water bottle, and the book you are currently reading.',
    photos: [
      '/images/web/roa-002-2026-11-05.webp',
      '/images/web/roa-004-2026-11-05.webp',
      '/images/web/roa-060-2026-11-05.webp'
    ],
    isUpcoming: true,
  },
  {
    id: 'meetup-past-13',
    title: 'Autumn Pages: Poetry & Prose of the Deccan',
    edition: 'Chapter 13',
    date: 'Sunday, October 18, 2026',
    time: '9:00 AM – 11:30 AM IST',
    venue: 'University Campus Lawns',
    address: 'Dr. Babasaheb Ambedkar Marathwada University Grounds, Aurangabad',
    description: 'An intimate gathering where 28 readers assembled with paperbacks across Marathi, Urdu, Hindi, and English. We explored the quiet joy of reading without social media interruptions.',
    featuredImage: '/images/hero/roa-006-2026-11-05.jpg',
    registrationUrl: 'https://forms.gle/readers-of-aurangabad',
    registrationStatus: 'past',
    activities: [
      'Silent Reading Hour',
      'Dakhani & Marathi Poetry Recitation',
      'Book Lending Circle'
    ],
    highlights: 'Members brought classic Marathi novels by V.P. Kale, Urdu poetry by Wali Dakhani, and contemporary global translations.',
    photos: [
      '/images/web/roa-054-2026-11-05.webp',
      '/images/web/roa-005-2026-11-05.webp',
      '/images/web/roa-059-2026-11-05.webp'
    ],
    isUpcoming: false,
  },
  {
    id: 'meetup-past-12',
    title: 'The Monsoon Book Exchange',
    edition: 'Chapter 12',
    date: 'Saturday, August 22, 2026',
    time: '4:00 PM – 6:30 PM IST',
    venue: 'Independent Café Courtyard',
    address: 'Osmanpura, Aurangabad',
    description: 'A rain-soaked afternoon dedicated to physical book donations, personal recommendations, and warm chai while sharing passages that transformed our perspectives.',
    featuredImage: '/images/web/roa-020-2026-11-05.webp',
    registrationUrl: 'https://forms.gle/readers-of-aurangabad',
    registrationStatus: 'past',
    activities: [
      'Chai & Book Pairing',
      'Blind Book Swap',
      'Discussion on Reading in the Age of Short-form Video'
    ],
    highlights: 'Over 40 books circulated among attendees.',
    photos: [
      '/images/web/roa-044-2026-11-05.webp',
      '/images/web/roa-049-2026-11-05.webp',
      '/images/web/roa-051-2026-11-05.webp'
    ],
    isUpcoming: false,
  }
];

export const initialArticles: JournalArticle[] = [
  {
    id: 'journal-1',
    title: 'Why Physical Books and Open Skies Still Matter in MH20',
    slug: 'physical-books-open-skies-mh20',
    author: 'Abdul Rafe Farooqui',
    authorRole: 'Founder, Readers of Aurangabad',
    category: 'Literature & Culture',
    publishedDate: 'November 2, 2026',
    readingTime: '5',
    coverImage: '/images/journal/roa-009-2026-11-05.jpg',
    excerpt: 'In an era where attention is fractured into seconds, sitting under a neem tree in Aurangabad with a book is a quiet act of gentle rebellion.',
    content: `When we first thought of bringing readers together in Aurangabad, some asked why people would step out on a Sunday morning just to read what they could read in bed.

The answer became clear in the very first hour: reading is inherently solitary, yet the hunger to share what moved us is deeply human. When twenty people sit together on grass under morning sunlight—each lost in a distinct universe—a rare collective stillness fills the air.

Aurangabad is an ancient cradle of memory. From the Ajanta caves where monks carved devotion into rock, to the lines of Wali Dakhani that laid the foundation of Urdu verse, this region has always honored contemplation.

By gathering in our city’s gardens, parks, and quiet corners, we are not creating an elitist literary salon. We are carving out a public sanctuary where a teenager reading manga sits beside a retired schoolmaster reading Marathi prose, and where no one asks for credentials before welcoming you to the circle.`,
    language: 'en',
    tags: ['Community', 'Aurangabad', 'Reading Culture', 'Philosophy'],
    featured: true,
  },
  {
    id: 'journal-2',
    title: 'औरंगाबाद की सुबह और किताबों का सुकून',
    slug: 'aurangabad-ki-subah-aur-kitabon-ka-sukoon',
    author: 'नेहा कुलकर्णी',
    authorRole: 'समुदाय सदस्या',
    category: 'Personal Essays',
    publishedDate: 'October 25, 2026',
    readingTime: '4',
    coverImage: '/images/journal/roa-006-2026-11-05.jpg',
    excerpt: 'मोबाइल के नोटिफिकेशन और व्यस्तताओं के शोर में, रविवार की यह बैठक हमारे मानसिक सुकून का ठहराव बन चुकी है।',
    content: `औरंगाबाद में रविवार की सुबह अक्सर शांत होती है। लेकिन जब से 'रीडर्स ऑफ औरंगाबाद' की मुलाकातों का सिलसिला शुरू हुआ, यह सुबह एक नई रूहानी पहचान पा चुकी है।

जब मैंने पहली बार बैठक में हिस्सा लिया, तो मुझे लगा कि यहाँ सब विद्वान होंगे जो भारी-भरकम किताबों पर बहस करेंगे। लेकिन हकीकत इसके बिल्कुल उलट थी। यहाँ कोई भी किसी को परखता नहीं। आप जो चाहें पढ़ें—चाहे प्रेमचंद की कहानी हो, कोई अंग्रेज़ी उपन्यास या मराठी कविता संग्रह।

पन्नों की महक और दूर से आती चिड़ियों की चहचहाहट के बीच एक घंटा चुपचाप पढ़ना मन को ऐसा ताजगी भरा सुकून देता है जो किसी स्क्रीन पर नहीं मिल सकता। यह आंदोलन शहर की भागदौड़ में हमें ठहरना सिखा रहा है।`,
    language: 'hi',
    tags: ['हिंदी संस्मरण', 'औरंगाबाद', 'वाचन'],
    featured: true,
  },
  {
    id: 'journal-3',
    title: 'دکن کی خاک، مطالعے کا ذوق اور نئی نسل',
    slug: 'deccan-ki-khaak-aur-mutala',
    author: 'سید فیضان احمد',
    authorRole: 'کالم نگار و قاری',
    category: 'Literature & Culture',
    publishedDate: 'October 12, 2026',
    readingTime: '6',
    coverImage: '/images/journal/roa-054-2026-11-05.jpg',
    excerpt: 'اورنگ آباد صرف تاریخی یادگاروں کا شہر نہیں، بلکہ یہ لفظ، کتاب اور فکر کی بستی بھی رہا ہے۔',
    content: `اورنگ آباد کی فضائیں ہمیشہ سے علم اور ادب کی خوشبو سے معطر رہی ہیں۔ ولی دکنی سے لے کر جدید دور تک، یہاں کا قاری ہمیشہ فکری بالیدگی کا علمبردار رہا ہے۔ 

موجودہ تیز رفتار ڈیجیٹل دنیا میں 'ریڈرز آف اورنگ آباد' نے جو شمع روشن کی ہے، وہ درحقیقت اسی گم گشتہ ادبی وقار کی بازیافت ہے۔ نوجوانوں کا اپنے سمارٹ فونز کو ایک طرف رکھ کر کاغذی کتابوں کے اوراق پلٹنا اور پھر اس پر خلوص کے ساتھ گفتگو کرنا ایک ایسا منظر ہے جو دل کو امید سے بھر دیتا ہے۔

یہ بزم زبان و بیان کے تعصبات سے پاک ہے۔ یہاں اردو، ہندی، مراٹھی اور انگریزی کے رسیا ایک ہی چٹाई پر بیٹھے نظر آتے ہیں۔ یہی وہ حقیقی گنگا جمنی تہذیب ہے جو کتاب کے ذریعے دوبارہ پھل پھول رہی ہے۔`,
    language: 'ur',
    tags: ['اردو ادب', 'دکن', 'مطالعہ'],
    featured: false,
  },
  {
    id: 'journal-4',
    title: 'वाचनाची गोडी आणि शहराचा बदलता सांधा',
    slug: 'vachnachi-godi-aurangabad',
    author: 'रोहन देशपांडे',
    authorRole: 'नियमित वाचक',
    category: 'Reader Stories',
    publishedDate: 'September 28, 2026',
    readingTime: '4',
    coverImage: '/images/journal/roa-049-2026-11-05.jpg',
    excerpt: 'पुस्तकाचे प्रत्येक पान आपल्याला एका वेगळ्या जगात घेऊन जाते, आणि जेव्हा हे वाचन शहराच्या बागेत सहकाऱ्यांसोबत घडते तेव्हा आनंद द्विगुणित होतो.',
    content: `लहानपणी उन्हाळ्याच्या सुट्टीत लायब्ररीतून आणलेली पुस्तके वाचताना वेळेचे भान हरपायचे. कॉलेज संपले, नोकरी लागली आणि हळूहळू पुस्तके बाजूला पडत गेली. 

पण रीडर्स ऑफ औरंगाबादच्या पहिल्याच भेटीत मला ती हरवलेली सवय पुन्हा गवसली. कोणताही दिखावा नाही, कोणतीही स्पर्धा नाही. फक्त शांतपणे पुस्तक उघडणे आणि वाचनात रमून जाणे.

छत्रपती संभाजीनगरमधील तरुणाई अशा उपक्रमाला एवढा भरभरून प्रतिसाद देईल याची कल्पना नव्हती. पुस्तके केवळ ज्ञान देत नाहीत, तर ती आपल्याला माणूस म्हणून समृद्ध करतात. हा अनुभव प्रत्येकाने एकदा तरी घेतलाच पाहिजे.`,
    language: 'mr',
    tags: ['मराठी वाचक', 'अनुभव', 'पुस्तके'],
    featured: false,
  }
];

export const initialReaderStories: ReaderStory[] = [
  {
    id: 'story-1',
    name: 'Ananya Sharma',
    location: 'Cidco, Aurangabad',
    favoriteBooks: ['The God of Small Things', 'Malgudi Days'],
    quote: 'I thought I lost my reading habit to screen addiction. Sitting in the silence of Chapter 8 brought my focus back.',
    story: 'Before joining the meetup, I could barely get through two pages before checking my phone. Being surrounded by readers who were deeply immersed reminded me that attention is a muscle we can nurture.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    memberSince: 'July 2026'
  },
  {
    id: 'story-2',
    name: 'Mohammad Zaid',
    location: 'Roshan Gate, Aurangabad',
    favoriteBooks: ['Ghalib’s Diwan', 'A Fine Balance by Rohinton Mistry'],
    quote: 'In our city, finding people who want to talk about characters and poetic metaphors was a dream. Now it’s my Sunday morning reality.',
    story: 'I love that there is zero pretension. You can show up with a graphic novel or an 800-page historical chronicle—everyone treats your reading journey with respect.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    memberSince: 'August 2026'
  },
  {
    id: 'story-3',
    name: 'Kavita Joshi',
    location: 'Samarth Nagar, Aurangabad',
    favoriteBooks: ['Yayati by V.S. Khandekar', 'The Midnight Library'],
    quote: 'Books are friends who never demand anything except your unhurried presence.',
    story: 'As a mother of two, finding two hours of uninterrupted quiet is a luxury. The Sunday park meetups are my sacred self-care hours.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    memberSince: 'June 2026'
  }
];

export const initialGallery: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'The Sunday Chapter Under Deccan Palms',
    caption: 'Over 30 readers gathered under morning sunlight with open books.',
    imageUrl: '/images/gallery/roa-009-2026-11-05.webp',
    date: 'October 2026'
  },
  {
    id: 'gal-2',
    title: 'Gathered on the Stepped Terraces',
    caption: 'Community readers assembled with books across Marathi, Hindi, Urdu, and English.',
    imageUrl: '/images/gallery/roa-006-2026-11-05.webp',
    date: 'October 2026'
  },
  {
    id: 'gal-3',
    title: 'Deep in the Pages: Youth Reading Circle',
    caption: 'Young readers immersed in paperbacks on the sunlit stone steps.',
    imageUrl: '/images/gallery/roa-060-2026-11-05.webp',
    date: 'October 2026'
  },
  {
    id: 'gal-4',
    title: 'Morning Sunlight & Open Spines',
    caption: 'Readers seated together on mats under the trees, sharing quiet reading hours.',
    imageUrl: '/images/gallery/roa-059-2026-11-05.webp',
    date: 'September 2026'
  },
  {
    id: 'gal-5',
    title: 'Book Recommendations & Shared Titles',
    caption: 'Readers presenting beloved titles including self-growth, fiction, and philosophy.',
    imageUrl: '/images/gallery/roa-020-2026-11-05.webp',
    date: 'September 2026'
  },
  {
    id: 'gal-6',
    title: 'Reflections from the Podium',
    caption: 'Open literary conversation and thoughtful commentary in the reading circle.',
    imageUrl: '/images/gallery/roa-044-2026-11-05.webp',
    date: 'August 2026'
  },
  {
    id: 'gal-7',
    title: 'The Grass Lawn Assembly',
    caption: 'Sunday morning peaceful reading circle spreading across the garden lawns.',
    imageUrl: '/images/gallery/roa-054-2026-11-05.webp',
    date: 'October 2026'
  },
  {
    id: 'gal-8',
    title: 'Women of Words: Readers of MH20',
    caption: 'Active women readers and students sharing recommendations at the community meetup.',
    imageUrl: '/images/gallery/roa-051-2026-11-05.webp',
    date: 'August 2026'
  },
  {
    id: 'gal-9',
    title: 'Dua Foundation Chapter Gathering',
    caption: 'Readers of Aurangabad assembly outside the historic venue near Delhi Gate.',
    imageUrl: '/images/gallery/roa-049-2026-11-05.webp',
    date: 'August 2026'
  },
  {
    id: 'gal-10',
    title: 'Voices of the Community',
    caption: 'A member sharing reflections on how reading transformed their daily perspective.',
    imageUrl: '/images/gallery/roa-004-2026-11-05.webp',
    date: 'October 2026'
  },
  {
    id: 'gal-11',
    title: 'Chairs, Mats & Unbroken Silence',
    caption: 'Finding peace in the park—60 minutes of uninterrupted silent reading.',
    imageUrl: '/images/gallery/roa-002-2026-11-05.webp',
    date: 'September 2026'
  },
  {
    id: 'gal-12',
    title: 'Stewards of the Reading Movement',
    caption: 'Abdul Rafe Farooqui and community members standing for the literary revival of Aurangabad.',
    imageUrl: '/images/gallery/roa-061-2026-11-05.webp',
    date: 'October 2026'
  }
];

export const initialEnquiries: Enquiry[] = [
  {
    id: 'enq-1',
    type: 'volunteer',
    name: 'Sameer Kulkarni',
    email: 'sameer.kulkarni@example.com',
    phone: '+91 98220 12345',
    message: 'I would love to help coordinate venue arrangements and manage registrations on Sunday mornings.',
    details: { skills: ['Event Logistics', 'Photography'], availability: 'Weekends' },
    createdAt: '2026-11-01T10:30:00Z',
    status: 'new'
  },
  {
    id: 'enq-2',
    type: 'book_donation',
    name: 'Dr. Fatima Khan',
    email: 'fatima.khan@example.com',
    phone: '+91 94230 67890',
    message: 'I have around 45 English classics and Urdu fiction paperbacks in excellent condition to contribute to the community library shelf.',
    details: { count: '45 books', genre: 'Classics & Urdu Fiction' },
    createdAt: '2026-11-03T15:20:00Z',
    status: 'new'
  }
];

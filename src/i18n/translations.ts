import type { Language } from '../types';

export interface Translations {
  nav: {
    home: string;
    story: string;
    gatherings: string;
    journal: string;
    community: string;
    getInvolved: string;
    contact: string;
    joinCommunity: string;
    admin: string;
  };
  hero: {
    tag: string;
    headline: string;
    supporting: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  intro: {
    heading: string;
    subheading: string;
    body: string;
  };
  philosophy: {
    heading: string;
    subheading: string;
    p1Title: string;
    p1Desc: string;
    p2Title: string;
    p2Desc: string;
    p3Title: string;
    p3Desc: string;
    p4Title: string;
    p4Desc: string;
  };
  gatherings: {
    upcomingHeading: string;
    upcomingSub: string;
    emptyUpcoming: string;
    pastHeading: string;
    pastSub: string;
    registerNow: string;
    registrationClosed: string;
    announced: string;
    experienceHeading: string;
    experienceSub: string;
    viewAllGatherings: string;
    philosophyEyebrow: string;
    philosophyHeading: string;
    philosophyIntro: string;
    philosophyP1Title: string;
    philosophyP1Desc: string;
    philosophyP2Title: string;
    philosophyP2Desc: string;
    philosophyP3Title: string;
    philosophyP3Desc: string;
    philosophyP4Title: string;
    philosophyP4Desc: string;
    coreBeliefLabel: string;
    coreBeliefQuote: string;
  };
  journal: {
    heading: string;
    subheading: string;
    readTime: string;
    readArticle: string;
    backToJournal: string;
    shareArticle: string;
    allCategories: string;
  };
  community: {
    heading: string;
    subheading: string;
    readersTitle: string;
    storiesTitle: string;
    galleryTitle: string;
    teamTitle: string;
  };
  getInvolved: {
    heading: string;
    subheading: string;
    joinTitle: string;
    volunteerTitle: string;
    donateTitle: string;
    collaborateTitle: string;
  };
  footer: {
    tagline: string;
    mission: string;
    location: string;
    rights: string;
    cityIdentity: string;
  };
  common: {
    learnMore: string;
    close: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      story: 'Our Story',
      gatherings: 'Gatherings',
      journal: 'The Journal',
      community: 'Community',
      getInvolved: 'Get Involved',
      contact: 'Contact',
      joinCommunity: 'Join the Community',
      admin: 'Admin Portal',
    },
    hero: {
      tag: 'A Reading Movement in MH20 • Aurangabad',
      headline: 'Somewhere between the pages, we found each other.',
      supporting: 'A reading movement in Aurangabad bringing people, books, ideas, and stories together. A space where everyone belongs, and every page opens a new possibility.',
      ctaPrimary: 'Join the Community',
      ctaSecondary: 'Explore Our Story',
    },
    intro: {
      heading: 'More than a reading club.',
      subheading: 'A living literary habitat in the historic heart of the Deccan',
      body: 'We are building a space where reading becomes a shared experience. Where strangers become familiar faces, conversations begin with books, and every reader finds a place to belong.',
    },
    philosophy: {
      heading: 'Our Guiding Philosophy',
      subheading: 'Literature knows no artificial boundaries.',
      p1Title: 'Read Together',
      p1Desc: 'Reading should become a shared human experience, not just a solitary retreat. When we read side by side, solitary worlds connect.',
      p2Title: 'Think Freely',
      p2Desc: 'No dogmas, no mandatory reading lists. We embrace intellectual curiosity without judgment, valuing diverse perspectives.',
      p3Title: 'Share Stories',
      p3Desc: 'Every reader carries a story. Every book is a lens through which we discover each other and our shared humanity.',
      p4Title: 'Build Community',
      p4Desc: 'Physical books and real-world connections matter. We foster genuine, lifelong friendships rooted in culture and kindness.',
    },
    gatherings: {
      upcomingHeading: 'Upcoming Gatherings',
      upcomingSub: 'Join us under the open sky or cozy local spaces with your favorite book.',
      emptyUpcoming: 'Something is brewing between the pages. Stay connected for our next gathering.',
      pastHeading: 'Archive of Past Gatherings',
      pastSub: 'Every meetup writes a quiet chapter in our collective history.',
      registerNow: 'Register via Google Form',
      registrationClosed: 'Registration Closed',
      announced: 'Venue Coming Soon',
      experienceHeading: 'The Meetup Experience',
      experienceSub: 'What happens when readers meet in Aurangabad?',
      viewAllGatherings: 'View Full Gatherings Archive',
      philosophyEyebrow: 'How We Gather',
      philosophyHeading: 'Our Meetup & Community Engagement Philosophy',
      philosophyIntro: 'We believe in building a meaningful reading community, not in organising events simply to keep a schedule. Here is what guides every gathering we host — and every conversation we keep alive between them.',
      philosophyP1Title: 'Flexible Scheduling',
      philosophyP1Desc: 'Meetups are organised around genuine community interest, team availability, and suitable arrangements — never a rigid monthly calendar.',
      philosophyP2Title: 'Quality Over Frequency',
      philosophyP2Desc: 'Every meetup should feel engaging, comfortable, and worth attending. We value meaningful interactions and memorable reading experiences over the number of events.',
      philosophyP3Title: 'Consistent Community Engagement',
      philosophyP3Desc: 'The community stays active between physical meetups through reading discussions, polls, book conversations, and interactive WhatsApp activities.',
      philosophyP4Title: 'Transparency & Authenticity',
      philosophyP4Desc: 'Our website and social platforms reflect our actual activities. Completed meetups are displayed as they happen, while upcoming events are announced only after confirmation.',
      coreBeliefLabel: 'Our Core Belief',
      coreBeliefQuote: 'We are not here merely to organise meetups. We are here to build a culture of reading, meaningful conversations, and lasting connections among readers in Aurangabad.',
    },
    journal: {
      heading: 'The Literary Journal',
      subheading: 'Essays, reader memoirs, cultural reflections, and poetry from Aurangabad and beyond.',
      readTime: 'min read',
      readArticle: 'Read Full Piece',
      backToJournal: 'Back to Journal',
      shareArticle: 'Share this Piece',
      allCategories: 'All Categories',
    },
    community: {
      heading: 'The People Behind the Pages',
      subheading: 'Readers, writers, dreamers, and storytellers shaping Aurangabad’s literary revival.',
      readersTitle: 'Voices of Readers',
      storiesTitle: 'Reader Stories',
      galleryTitle: 'Community Moments',
      teamTitle: 'Organizing Stewards',
    },
    getInvolved: {
      heading: 'Ways to Participate',
      subheading: 'Whether you have an hour to volunteer or a stack of books to share, there is a role for you.',
      joinTitle: 'Join the Community',
      volunteerTitle: 'Become a Volunteer',
      donateTitle: 'Donate Physical Books',
      collaborateTitle: 'Collaborate With Us',
    },
    footer: {
      tagline: 'Making reading a part of everyday life again.',
      mission: 'Readers of Aurangabad (Readers of MH20) is an independent, non-profit community reading movement cultivating a thriving reading culture in Chhatrapati Sambhajinagar (Aurangabad), Maharashtra.',
      location: 'Aurangabad (Chhatrapati Sambhajinagar), Maharashtra, India',
      rights: 'All rights reserved.',
      cityIdentity: 'Readers of MH20',
    },
    common: {
      learnMore: 'Learn More',
      close: 'Close',
      submit: 'Submit Enquiry',
      submitting: 'Submitting...',
      success: 'Thank you! Your message has been received.',
      error: 'Please fill in all required fields.',
    },
  },
  hi: {
    nav: {
      home: 'मुखपृष्ठ',
      story: 'हमारी कहानी',
      gatherings: 'बैठकें एवं मुलाक़ातें',
      journal: 'साहित्यिक पत्रिका',
      community: 'समुदाय',
      getInvolved: 'सहभागी बनें',
      contact: 'संपर्क',
      joinCommunity: 'समुदाय से जुड़ें',
      admin: 'प्रशासक पोर्टल',
    },
    hero: {
      tag: 'MH20 • औरंगाबाद का एक खुला पुस्तक आंदोलन',
      headline: 'पन्नों के दरमियां, हम एक दूसरे से मिले।',
      supporting: 'औरंगाबाद में किताबों, इंसानों, नए विचारों और कहानियों को एक सूत्र में पिरोने वाला एक पाठक आंदोलन। एक ऐसी जगह जहाँ हर पाठक का स्वागत है और हर पन्ना एक नई शुरुआत है।',
      ctaPrimary: 'समुदाय से जुड़ें',
      ctaSecondary: 'हमारी कहानी जानिए',
    },
    intro: {
      heading: 'सिर्फ एक बुक क्लब से कहीं बढ़कर।',
      subheading: 'दक्कन की ऐतिहासिक धरती पर पनपती एक साहित्यिक संस्कृति',
      body: 'हम एक ऐसा आशियाना बना रहे हैं जहाँ पढ़ना सिर्फ अकेलेपन की आदत नहीं, बल्कि एक साझा अनुभव बन जाए। जहाँ अजनबी अपने बन जाते हैं और संवाद की शुरुआत किताबों से होती है।',
    },
    philosophy: {
      heading: 'हमारे बुनियादी मूल्य',
      subheading: 'साहित्य किसी भाषा, जाति या उम्र की सरहदों में नहीं बंधता।',
      p1Title: 'साथ पढ़ें',
      p1Desc: 'पढ़ना सिर्फ़ अकेलेपन का काम नहीं, एक साझा मानवीय अनुभव बने। साथ बैठकर पढ़ने से दिल जुड़ते हैं।',
      p2Title: 'स्वतंत्र सोच',
      p2Desc: 'बिना किसी पूर्वाग्रह या थोपी गई किताबों के। हम हर विचार और दृष्टिकोण का सम्मान करते हैं।',
      p3Title: 'कहानियां साझा करें',
      p3Desc: 'हर पाठक के भीतर एक अनकही कहानी होती है। किताबें हमें एक-दूसरे को समझने का आईना देती हैं।',
      p4Title: 'समुदाय निर्माण',
      p4Desc: 'कागज़ी किताबें और असल ज़िंदगी के रिश्ते अनमोल हैं। हम सच्ची मित्रता और स्नेह की बुनियाद रखते हैं।',
    },
    gatherings: {
      upcomingHeading: 'आगामी बैठकें',
      upcomingSub: 'खुले आसमान या सुकून भरी जगहों पर अपनी मनपसंद किताब के साथ शामिल हों।',
      emptyUpcoming: 'पन्नों के बीच कुछ नया आकार ले रहा है। हमारी अगली बैठक के लिए जुड़े रहें।',
      pastHeading: 'पिछली बैठकों की यादें',
      pastSub: 'हर बैठक हमारे सामूहिक इतिहास का एक शांत और सुंदर अध्याय है।',
      registerNow: 'गूगल फॉर्म द्वारा पंजीकरण करें',
      registrationClosed: 'पंजीकरण समाप्त',
      announced: 'स्थान की घोषणा शीघ्र',
      experienceHeading: 'बैठक का अनुभव',
      experienceSub: 'जब औरंगाबाद में पाठक मिलते हैं, तो क्या होता है?',
      viewAllGatherings: 'सभी बैठकों का संग्रह देखें',
      philosophyEyebrow: 'हम कैसे एकत्र होते हैं',
      philosophyHeading: 'हमारी बैठक एवं सामुदायिक सहभागिता का दर्शन',
      philosophyIntro: 'हमारा मानना है कि एक सार्थक पाठक समुदाय बनाना चाहिए, केवल कार्यक्रमों का कैलेंडर भरना नहीं। यही हमारी हर बैठक का मार्गदर्शन करता है — और उनके बीच चलने वाली हर बातचीत का भी।',
      philosophyP1Title: 'लचीली समय-सारणी',
      philosophyP1Desc: 'बैठकें वास्तविक सामुदायिक रुचि, टीम की उपलब्धता और उपयुक्त व्यवस्था के अनुसार आयोजित की जाती हैं — किसी कठोर मासिक कैलेंडर के अनुसार नहीं।',
      philosophyP2Title: 'संख्या से अधिक गुणवत्ता',
      philosophyP2Desc: 'हर बैठक रोचक, सहज और उपस्थित होने योग्य होनी चाहिए। हम कार्यक्रमों की संख्या से अधिक सार्थक संवाद और यादगार पढ़ने के अनुभवों को महत्व देते हैं।',
      philosophyP3Title: 'निरंतर सामुदायिक सहभागिता',
      philosophyP3Desc: 'भौतिक बैठकों के बीच भी समुदाय पठन-चर्चा, पोल, किताबों पर संवाद और व्हाट्सएप की इंटरैक्टिव गतिविधियों से सक्रिय रहता है।',
      philosophyP4Title: 'पारदर्शिता एवं प्रामाणिकता',
      philosophyP4Desc: 'हमारी वेबसाइट और सोशल प्लेटफ़ॉर्म हमारी वास्तविक गतिविधियों को दर्शाते हैं। पूरी हो चुकी बैठकें उनके होते ही प्रदर्शित की जाती हैं, और आगामी कार्यक्रमों की घोषणा पुष्टि के बाद ही की जाती है।',
      coreBeliefLabel: 'हमारा मूल विश्वास',
      coreBeliefQuote: 'हम यहाँ केवल बैठकों का आयोजन करने नहीं आए हैं। हम औरंगाबाद के पाठकों के बीच पढ़ने की संस्कृति, सार्थक संवाद और स्थायी रिश्ते बनाने आए हैं।',
    },
    journal: {
      heading: 'साहित्यिक पत्रिका',
      subheading: 'औरंगाबाद और अन्य शहरों के पाठकों के निबंध, संस्मरण, कविताएँ और विचार।',
      readTime: 'मिनट पढ़ने का समय',
      readArticle: 'पूरा लेख पढ़ें',
      backToJournal: 'पत्रिका पर वापस जाएं',
      shareArticle: 'लेख साझा करें',
      allCategories: 'सभी श्रेणियां',
    },
    community: {
      heading: 'पन्नों के पीछे की रूहें',
      subheading: 'औरंगाबाद के पाठक, लेखक और स्वप्नद्रष्टा जो इस आंदोलन को संवार रहे हैं।',
      readersTitle: 'पाठकों की आवाज़',
      storiesTitle: 'पाठक संस्मरण',
      galleryTitle: 'बैठकों की झलकियाँ',
      teamTitle: 'मार्गदर्शक एवं आयोजक',
    },
    getInvolved: {
      heading: 'सहभागी कैसे बनें?',
      subheading: 'चाहे आपके पास स्वयंसेवा के लिए समय हो या बांटने के लिए किताबें, आपका स्वागत है।',
      joinTitle: 'समुदाय का हिस्सा बनें',
      volunteerTitle: 'स्वयंसेवक बनें',
      donateTitle: 'किताबें दान करें',
      collaborateTitle: 'सहयोग एवं साझेदारी',
    },
    footer: {
      tagline: 'किताब पढ़ने को रोजमर्रा की ज़िंदगी का हिस्सा बनाना।',
      mission: 'रीडर्स ऑफ औरंगाबाद (Readers of MH20) छत्रपति संभाजीनगर (औरंगाबाद) का एक स्वतंत्र साहित्यिक आंदोलन है।',
      location: 'औरंगाबाद (छत्रपति संभाजीनगर), महाराष्ट्र, भारत',
      rights: 'सर्वाधिकार सुरक्षित।',
      cityIdentity: 'रीडर्स ऑफ MH20',
    },
    common: {
      learnMore: 'अधिक जानें',
      close: 'बंद करें',
      submit: 'भेजें',
      submitting: 'भेजा जा रहा है...',
      success: 'शुक्रिया! आपका संदेश प्राप्त हो गया है।',
      error: 'कृपया सभी आवश्यक फ़ील्ड भरें।',
    },
  },
  ur: {
    nav: {
      home: 'صفحۂ اول',
      story: 'ہماری کہانی',
      gatherings: 'نشستیں اور ملاقاتیں',
      journal: 'ادبی جریدہ',
      community: 'ہماری بزم',
      getInvolved: 'شریکِ سفر بنیں',
      contact: 'رابطہ',
      joinCommunity: 'بزم میں شامل ہوں',
      admin: 'ایڈمن پورٹل',
    },
    hero: {
      tag: 'MH20 • اورنگ آباد میں مطالعے کی ایک خوبصورت تحریک',
      headline: 'صفحات کے درمیاں، ہم ایک دوسرے سے ملے۔',
      supporting: 'اورنگ آباد میں کتابوں، انسانوں، افکار اور کہانیوں کو جوڑنے والی ایک بیدار تحریک۔ ایک ایسی فضا جہاں ہر قاری کا خیرمقدم ہے اور ہر ورق ایک نیا سفر ہے۔',
      ctaPrimary: 'بزم میں شامل ہوں',
      ctaSecondary: 'ہماری کہانی جانیں',
    },
    intro: {
      heading: 'محض ایک بک کلب سے کہیں بڑھ کر۔',
      subheading: 'دکن کے تاریخی قلب میں ایک زندہ ادبی مسکن',
      body: 'ہم ایک ایسی جگہ تعمیر کر رہے ہیں جہاں مطالعہ صرف تنہائی کا مشغلہ نہیں بلکہ ایک اشتراکی احساس بن جائے۔ جہاں اجنبی مانوس چہرے بن جائیں اور گفتگو کتابوں سے شروع ہو۔',
    },
    philosophy: {
      heading: 'ہمارے بنیادی اصول',
      subheading: 'ادب زبان، مذہب اور عمر کی سرحدوں سے ماورا ہے۔',
      p1Title: 'ساتھ مل کر پڑھیں',
      p1Desc: 'مطالعہ ایک مشترکہ انسانی تجربہ بنے۔ جب ہم پاس بیٹھ کر پڑھتے ہیں، تو خاموش دنیائیں آپس میں جڑ جاتی ہیں۔',
      p2Title: 'آزاد فکری',
      p2Desc: 'کسی تعصب یا جبری فہرست کے بغیر۔ ہم بلا امتیاز ہر فکری زاویے اور نقطۂ نظر کا احترام کرتے ہیں۔',
      p3Title: 'داستان سرائی',
      p3Desc: 'ہر قاری کے سینے میں ایک داستان پوشیدہ ہے۔ کتابیں ہمیں ایک دوسرے کو سمجھنے کا آئینہ دکھاتی ہیں۔',
      p4Title: 'تعمیرِ معاشرہ',
      p4Desc: 'کاغذی کتابیں اور حقیقی انسانی روابط نہایت قیمتی ہیں۔ ہم خلوص اور تہذیب پر مبنی دیرپا تعلقات قائم کرتے ہیں۔',
    },
    gatherings: {
      upcomingHeading: 'آئندہ نشستیں',
      upcomingSub: 'کھلے آسمان تلے یا پرسکون گوشوں میں اپنی پسندیدہ کتاب کے ہمراہ تشریف لائیں۔',
      emptyUpcoming: 'کتاب کے اوراق میں کچھ نیا جنم لے رہا ہے۔ اگلی نشست کی اطلاع کے لیے جڑے رہیں۔',
      pastHeading: 'گزشتہ نشستوں کا نگارخانہ',
      pastSub: 'ہماری ہر ملاقات تاریخ کا ایک خاموش اور پروقار باب ہے۔',
      registerNow: 'گوگل فارم کے ذریعے اندراج کریں',
      registrationClosed: 'اندراج بند ہو چکا ہے',
      announced: 'مقام کا اعلان جلد ہوگا',
      experienceHeading: 'نشست کا احوال و تجربہ',
      experienceSub: 'جب اورنگ آباد کے قارئین مل بیٹھتے ہیں تو کیا ہوتا ہے؟',
      viewAllGatherings: 'تمام نشستوں کا آرکائیو دیکھیں',
      philosophyEyebrow: 'ہم کیسے جمع ہوتے ہیں',
      philosophyHeading: 'ہماری نشست اور کمیونٹی شرکت کا فلسفہ',
      philosophyIntro: 'ہم ایک بامعنی قارئین کی کمیونٹی تعمیر کرنے پر یقین رکھتے ہیں، محض شیڈول برقرار رکھنے کے لیے تقریبات منعقد کرنے پر نہیں۔ یہی ہر نشست کی رہنمائی کرتا ہے — اور ان کے درمیان جاری ہر گفتگو کی بھی۔',
      philosophyP1Title: 'لچکدار شیڈول',
      philosophyP1Desc: 'نشستیں حقیقی کمیونٹی دلچسپی، ٹیم کی دستیابی اور مناسب انتظامات کے مطابق منعقد کی جاتی ہیں — کسی سخت ماہانہ کیلنڈر کے مطابق نہیں۔',
      philosophyP2Title: 'تعداد پر معیار',
      philosophyP2Desc: 'ہر نشست دلچسپ، پرسکون اور شرکت کے قابل ہونی چاہیے۔ ہم تقریبات کی تعداد کے بجائے بامعنی مکالمے اور یادگار مطالعے کے تجربات کو اہمیت دیتے ہیں۔',
      philosophyP3Title: 'مسلسل کمیونٹی شرکت',
      philosophyP3Desc: 'جسمانی نشستوں کے درمیان بھی کمیونٹی مطالعے کی گفتگو، پولز، کتابوں پر مباحثے اور واٹس ایپ کی دلچسپ سرگرمیوں کے ذریعے فعال رہتی ہے۔',
      philosophyP4Title: 'شفافیت اور اصلیت',
      philosophyP4Desc: 'ہماری ویب سائٹ اور سوشل پلیٹ فارمز ہماری حقیقی سرگرمیوں کی عکاسی کرتے ہیں۔ مکمل ہونے والی نشستیں وقت پر دکھائی جاتی ہیں، جبکہ آئندہ تقریبات کا اعلان تصدیق کے بعد ہی کیا جاتا ہے۔',
      coreBeliefLabel: 'ہمارا بنیادی یقین',
      coreBeliefQuote: 'ہم یہاں صرف نشستیں منعقد کرنے نہیں آئے۔ ہم اورنگ آباد کے قارئین کے درمیان مطالعے کی ثقافت، بامعنی گفتگو اور دیرپا رشتے تعمیر کرنے آئے ہیں۔',
    },
    journal: {
      heading: 'ادبی جریدہ',
      subheading: 'مضامین، تبصرے، قارئین کی یادداشتیں اور اورنگ آباد کے قلم کاروں کی نگارشات۔',
      readTime: 'منٹ کا مطالعہ',
      readArticle: 'مکمل تحریر پڑھیں',
      backToJournal: 'جریدے پر واپس',
      shareArticle: 'تحریر شیئر کریں',
      allCategories: 'تمام اصناف',
    },
    community: {
      heading: 'صفحات کے پیچھے سانس لیتی شخصیات',
      subheading: 'اورنگ آباد کے باذوق قارئین، مصنّفین اور وہ لوگ جو پڑھنے کے کلچر کو زندہ کر رہے ہیں۔',
      readersTitle: 'قارئین کی آواز',
      storiesTitle: 'قارئین کی کہانیاں',
      galleryTitle: 'نشستوں کی جھلکیاں',
      teamTitle: 'انتظامی رفقاء',
    },
    getInvolved: {
      heading: 'شراکت کے راستے',
      subheading: 'چاہے آپ کے پاس رضا کارانہ وقت ہو یا کتابوں کا تحفہ، آپ کے لیے یہاں ایک جگہ ہے۔',
      joinTitle: 'تحریک میں شمولیت',
      volunteerTitle: 'بطور رضاکار خدمت',
      donateTitle: 'کتابیں عطیہ کریں',
      collaborateTitle: 'ادبی و ثقافتی اشتراک',
    },
    footer: {
      tagline: 'مطالعے کو روزمرہ زندگی کا حصہ بنانا۔',
      mission: 'ریڈرز آف اورنگ آباد (Readers of MH20) چھترپتی سمبھا جی نگر (اورنگ آباد) میں مطالعے کے فروغ کے لیے ایک خود مختار تحریک ہے۔',
      location: 'اورنگ آباد (چھترپتی سمبھا جی نگر)، مہاراشٹر، بھارت',
      rights: 'جملہ حقوق محفوظ ہیں۔',
      cityIdentity: 'ریڈرز آف MH20',
    },
    common: {
      learnMore: 'مزید جانیے',
      close: 'بند کریں',
      submit: 'ارسال کریں',
      submitting: 'ارسال ہو رہا ہے...',
      success: 'شکریہ! آپ کا پیغام ہمیں موصول ہو گیا ہے۔',
      error: 'براہِ کرم تمام خانے پُر کریں۔',
    },
  },
  mr: {
    nav: {
      home: 'मुख्यपृष्ठ',
      story: 'आमची गोष्ट',
      gatherings: 'वाचन बैठका',
      journal: 'साहित्यिक मासिक',
      community: 'वाचक परिवार',
      getInvolved: 'सहभागी व्हा',
      contact: 'संपर्क',
      joinCommunity: 'समुदायात सामील व्हा',
      admin: 'प्रशासक पोर्टल',
    },
    hero: {
      tag: 'MH20 • औरंगाबादची एक स्वतंत्र वाचन चळवळ',
      headline: 'पानांच्या त्या वळणावर, आम्ही एकमेकांना गवसलो.',
      supporting: 'औरंगाबादमध्ये पुस्तके, माणसे, नवे विचार आणि कथा एकत्र आणणारी एक वाचन चळवळ. एक अशी जागा जिथे प्रत्येकाचे स्वागत आहे आणि प्रत्येक पान नवी शक्यता उघडते.',
      ctaPrimary: 'समुदायात सामील व्हा',
      ctaSecondary: 'आमची कहाणी जाणा',
    },
    intro: {
      heading: 'केवळ एका बुक क्लबपेक्षा खूप काही अधिक.',
      subheading: 'दख्खनच्या ऐतिहासिक भूमीत बहरत असलेली साहित्यिक संस्कृती',
      body: 'आम्ही अशी जागा निर्माण करत आहोत जिथे वाचन हा केवळ एकांताचा छंद न राहता एक सामूहिक आनंद बनतो. जिथे अनोळखी माणसे ओळखीची होतात आणि संभाषणाची सुरुवात पुस्तकांपासून होते.',
    },
    philosophy: {
      heading: 'आमची मार्गदर्शक मूल्ये',
      subheading: 'साहित्याला भाषा, धर्म आणि वयाची कोणतीही बंधने नसतात.',
      p1Title: 'एकत्र वाचन',
      p1Desc: 'वाचन हा एक सामायिक मानवी अनुभव बनला पाहिजे. जेव्हा आपण शेजारी बसून वाचतो, तेव्हा शांत मने एकत्र येतात.',
      p2Title: 'मुक्त विचार',
      p2Desc: 'कोणत्याही पूर्वग्रहाशिवाय किंवा लादलेल्या याद्यांशिवाय. आम्ही सर्व दृष्टिकोनांचा आदर करतो.',
      p3Title: 'गोष्टी सांगा',
      p3Desc: 'प्रत्येक वाचकाकडे एक न सांगितलेली गोष्ट असते. पुस्तके आपल्याला एकमेकांना समजून घेण्याचा मार्ग दाखवतात.',
      p4Title: 'समुदाय निर्मिती',
      p4Desc: 'मुद्रित पुस्तके आणि प्रत्यक्ष मानवी नातेसंबंध अनमोल आहेत. आम्ही आत्मीयतेची मैत्री निर्माण करतो.',
    },
    gatherings: {
      upcomingHeading: 'आगामी बैठका',
      upcomingSub: 'हिरवळीवर किंवा शांत कट्ट्यांवर आपल्या आवडत्या पुस्तकासह सहभागी व्हा.',
      emptyUpcoming: 'पानांच्या मागे काहीतरी सुंदर आकार घेत आहे. पुढील बैठकीच्या माहितीसाठी संपर्कात राहा.',
      pastHeading: 'मागील बैठकींच्या आठवणी',
      pastSub: 'प्रत्येक बैठक आपल्या सामूहिक प्रवासाचा एक शांत आणि सुंदर अध्याय आहे.',
      registerNow: 'गुगल फॉर्मद्वारे नावनोंदणी करा',
      registrationClosed: 'नोंदणी पूर्ण झाली',
      announced: 'जागा लवकरच जाहीर होईल',
      experienceHeading: 'बैठकीचा अनुभव',
      experienceSub: 'जेव्हा औरंगाबादचे वाचक एकत्र येतात, तेव्हा काय घडते?',
      viewAllGatherings: 'सर्व बैठकांचा संग्रह पहा',
      philosophyEyebrow: 'आम्ही कसे एकत्र येतो',
      philosophyHeading: 'आमची बैठक आणि सामुदायिक सहभागाचे तत्त्वज्ञान',
      philosophyIntro: 'आमचा विश्वास आहे की केवळ वेळापत्रक राखण्यासाठी कार्यक्रम करण्यापेक्षा अर्थपूर्ण वाचक समुदाय घडवणे महत्त्वाचे आहे. प्रत्येक बैठक आणि त्या दरम्यान सुरू राहणारा प्रत्येक संवाद याच विचाराने घडतो.',
      philosophyP1Title: 'लवचिक नियोजन',
      philosophyP1Desc: 'बैठका प्रत्यक्ष सामुदायिक रुची, टीमची उपलब्धता आणि योग्य व्यवस्थेनुसार आयोजित केल्या जातात — कठोर मासिक वेळापत्रकानुसार नाहीत.',
      philosophyP2Title: 'वारंवारतेपेक्षा गुणवत्ता',
      philosophyP2Desc: 'प्रत्येक बैठक आकर्षक, आरामदायी आणि उपस्थित राहण्यासारखी असावी. कार्यक्रमांच्या संख्येपेक्षा आम्ही अर्थपूर्ण संवाद आणि लक्षात राहणाऱ्या वाचन अनुभवांना महत्त्व देतो.',
      philosophyP3Title: 'सातत्यपूर्ण सामुदायिक सहभाग',
      philosophyP3Desc: 'प्रत्यक्ष बैठकांच्या दरम्यानही समुदाय वाचनचर्चा, मतदान, पुस्तकांविषयी संवाद आणि व्हॉट्सअॅपवरील परस्परसंवादी उपक्रमांमधून सक्रिय राहतो.',
      philosophyP4Title: 'पारदर्शकता व प्रामाणिकपणा',
      philosophyP4Desc: 'आमची वेबसाइट आणि सोशल मीडिया आमच्या प्रत्यक्ष कृतिशीलतेचे प्रतिबिंब आहेत. पूर्ण झालेल्या बैठका वेळोवेळी दाखवल्या जातात आणि आगामी कार्यक्रमांची घोषणा केवळ पुष्टीनंतरच केली जाते.',
      coreBeliefLabel: 'आमचा मूळ विश्वास',
      coreBeliefQuote: 'आम्ही केवळ बैठका आयोजित करण्यासाठी येथे नाही आलो. औरंगाबादच्या वाचकांमध्ये वाचनसंस्कृती, अर्थपूर्ण संवाद आणि टिकाऊ नाती घडवण्यासाठी आलो आहोत.',
    },
    journal: {
      heading: 'साहित्यिक मासिक',
      subheading: 'औरंगाबाद आणि महाराष्ट्रातील वाचकांचे ललित निबंध, आठवणी, कविता आणि विचार.',
      readTime: 'मिनिटांचे वाचन',
      readArticle: 'पूर्ण लेख वाचा',
      backToJournal: 'मासिकावर परत या',
      shareArticle: 'लेख शेअर करा',
      allCategories: 'सर्व वर्ग',
    },
    community: {
      heading: 'पानांमागील माणसं',
      subheading: 'औरंगाबादचे वाचक, लेखक आणि स्वप्न पाहणारे जे वाचन संस्कृती जपत आहेत.',
      readersTitle: 'वाचकांचे अनुभव',
      storiesTitle: 'वाचक अनुभव',
      galleryTitle: 'बैठकीचे क्षण',
      teamTitle: 'संयोजक व मार्गदर्शक',
    },
    getInvolved: {
      heading: 'सहभागाचे मार्ग',
      subheading: 'तुमच्याकडे स्वयंसेवेसाठी वेळ असो वा वाटण्यासाठी पुस्तके, तुमचे मनःपूर्वक स्वागत आहे.',
      joinTitle: 'चळवळीत सामील व्हा',
      volunteerTitle: 'स्वयंसेवक व्हा',
      donateTitle: 'पुस्तके दान करा',
      collaborateTitle: 'सहकार्य व भागीदारी',
    },
    footer: {
      tagline: 'वाचनाला रोजच्या जगण्याचा भाग बनवणे.',
      mission: 'रीडर्स ऑफ औरंगाबाद (Readers of MH20) छत्रपती संभाजीनगर (औरंगाबाद) मधील एक स्वतंत्र वाचन चळवळ आहे.',
      location: 'औरंगाबाद (छत्रपती संभाजीनगर), महाराष्ट्र, भारत',
      rights: 'सर्व हक्क राखीव.',
      cityIdentity: 'रीडर्स ऑफ MH20',
    },
    common: {
      learnMore: 'अधिक माहिती',
      close: 'बंद करा',
      submit: 'पाठवा',
      submitting: 'पाठवत आहे...',
      success: 'धन्यवाद! तुमचा संदेश आम्हाला मिळाला आहे.',
      error: 'कृपया सर्व आवश्यक रकाने भरा.',
    },
  },
};

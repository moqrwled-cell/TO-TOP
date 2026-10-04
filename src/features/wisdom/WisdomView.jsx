import { useState } from 'react';
import { BookMarked, Zap, Brain, Crosshair, Sun, Book, Bookmark, Coins, Compass, Briefcase, Smile, Anchor, HandHeart, Users, LineChart, Flame, Star, Shield, ShieldCheck, Gem, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BOOKS_DB = [
  {
    id: 'habits', title: 'العادات السبع', author: 'ستيفن كوفي', icon: Book, color: '#9b59b6',
    tagline: 'للناس الأكثر فعالية',
    intro: '"ابدأ والنهاية في ذهنك. النجاح الحقيقي ينبع من الداخل للخارج، ومن تغيير نظرتك للعالم."',
    lessons: [
      { title: 'كن مبادراً', text: 'لا تكن ضحية للظروف. أنت مسؤول عن استجابتك للمؤثرات. ركز على دائرة تأثيرك.' },
      { title: 'الأهم قبل المهم', text: 'ركز معظم وقتك في المربع الثاني (الأشياء الهامة وغير العاجلة) كالتخطيط.' },
      { title: 'اشحذ المنشار', text: 'التجديد المستمر لأبعادك الأربعة. لا تكن مشغولاً بالمنشار لدرجة تنسى شحذه!' }
    ]
  },
  {
    id: 'atomic', title: 'العادات الذرية', author: 'جيمس كلير', icon: Zap, color: '#ffd700',
    tagline: 'بناء الأنظمة لا الأهداف',
    intro: '"أنت لا ترتقي إلى مستوى أهدافك، بل تهبط إلى مستوى أنظمتك." النجاح نظام يومي.',
    lessons: [
      { title: 'قانون 1: اجعلها واضحة', text: 'استخدم نية التنفيذ: "سوف أقوم بـ [الفعل] في [الوقت] في [المكان]".' },
      { title: 'قانون 2: اجعلها سهلة', text: 'اجعل الأفعال الجيدة سهلة البدء، والأفعال السيئة صعبة الوصول.' },
      { title: 'تراكم 1%', text: 'التحسن بنسبة 1% يومياً يجعلك أفضل بـ 37 ضعفاً بنهاية العام.' }
    ]
  },
  {
    id: 'deepwork', title: 'العمل العميق', author: 'كال نيوبورت', icon: Brain, color: '#4da8da',
    tagline: 'قوة التركيز الخارق',
    intro: '"العمل العميق هو القدرة على التركيز بدون تشتت. إنها القوة الخارقة في القرن 21."',
    lessons: [
      { title: 'قاعدة 90/90/1', text: 'لـ 90 يوماً، خصص أول 90 دقيقة لأهم مهمة واحدة فقط. أغلق المشتتات.' },
      { title: 'التخلص من العمل الضحل', text: 'الإيميلات والمهام الروتينية تبقيك مشغولاً ولا تبني مجداً. قلل منها.' },
      { title: 'العزلة المنتجة', text: 'النجاح يتطلب "بلوكات" زمنية تكون فيها مختفياً تماماً للعمل بتركيز.' }
    ]
  },
  {
    id: 'frog', title: 'التهم هذا الضفدع', author: 'برايان تريسي', icon: Crosshair, color: '#ff6b6b',
    tagline: 'القضاء على التسويف',
    intro: '"إذا كان عليك أكل ضفدع حي، فمن الأفضل أن تفعل ذلك كأول شيء في الصباح."',
    lessons: [
      { title: 'التخطيط المسبق', text: 'دقيقة في التخطيط توفر 10 في التنفيذ. خطط ليومك في الليلة السابقة.' },
      { title: 'قانون 80/20', text: '20% من أنشطتك تساهم بـ 80% من نتائجك. ركز على هذه الـ 20%.' },
      { title: 'طريقة ABCDE', text: 'رتب مهامك: A (عواقب خطيرة)، B (أقل خطورة)، C (جميل)، D (فوّض)، E (احذف).' }
    ]
  },
  {
    id: '5am', title: 'نادي الـ 5 صباحاً', author: 'روبن شارما', icon: Sun, color: '#f39c12',
    tagline: 'امتلك صباحك',
    intro: '"امتلك صباحك، ترتقي بحياتك. الساعة الأولى من يومك تحدد مسار اليوم بأكمله."',
    lessons: [
      { title: 'صيغة 20/20/20', text: '20د رياضة، 20د تأمل وصلاة، 20د تعلم وقراءة في بداية يومك.' },
      { title: 'الفقاعة العبقرية', text: 'الهدوء في الفجر يمنح عقلك القدرة على العمل في حالة التدفق (Flow).' },
      { title: 'قاعدة 90 يوماً', text: 'استمر 90 يوماً لتبني العادة وتجعلها جزءاً أصيلاً من حياتك.' }
    ]
  },
  {
    id: 'richdad', title: 'الأب الغني والأب الفقير', author: 'روبرت كيوساكي', icon: Coins, color: '#2ecc71',
    tagline: 'محو الأمية المالية',
    intro: '"الفقراء يعملون من أجل المال، بينما الأغنياء يجعلون المال يعمل من أجلهم."',
    lessons: [
      { title: 'الأصول مقابل الخصوم', text: 'الأصل يضع المال في جيبك، والخصم يخرجه. استثمر دائماً في الأصول.' },
      { title: 'الثقافة المالية', text: 'المال بدون ذكاء مالي هو مال سريع الزوال. تعلم كيف تدار الأموال.' },
      { title: 'تجاوز الخوف', text: 'الخوف من المخاطرة هو أكبر عائق للثراء. المخاطرة المحسوبة هي طريق النجاح.' }
    ]
  },
  {
    id: 'thinkgrow', title: 'فكر تصبح غنياً', author: 'نابليون هيل', icon: Gem, color: '#e67e22',
    tagline: 'قوة العقل الباطن',
    intro: '"كل ما يمكن لعقل الإنسان أن يتخيله ويؤمن به، يمكنه تحقيقه."',
    lessons: [
      { title: 'الرغبة المشتعلة', text: 'نقطة البداية لأي إنجاز هي رغبة قاطعة ومحددة لا تقبل المساومة.' },
      { title: 'الإيمان التام', text: 'يجب أن تؤمن بقدرتك على تحقيق هدفك لدرجة أن تتصرف وكأنه تحقق.' },
      { title: 'العقل المدبر', text: 'أحط نفسك بأشخاص يشاركونك نفس الرؤية والطموح لتحقيق هدفك.' }
    ]
  },
  {
    id: 'cheese', title: 'من حرك قطعة الجبن؟', author: 'سبنسر جونسون', icon: Anchor, color: '#f1c40f',
    tagline: 'التعامل مع التغيير',
    intro: '"إذا لم تتغير، فمن الممكن أن تفنى. التغيير هو الشيء الوحيد الثابت في الحياة."',
    lessons: [
      { title: 'توقع التغيير', text: 'كن دائماً مستعداً لأن يتغير الوضع الحالي في أي لحظة.' },
      { title: 'التحرك بسرعة', text: 'كلما أسرعت في التخلي عن الجبن القديم، أسرعت في العثور على جبن جديد.' },
      { title: 'استمتع بالتغيير', text: 'لا تقاوم، بل انسجم مع التغيير واستمتع بمغامرة البحث عن فرص جديدة.' }
    ]
  },
  {
    id: 'powerhabit', title: 'قوة العادات', author: 'تشارلز دويج', icon: Brain, color: '#8e44ad',
    tagline: 'كيف نعمل ولماذا؟',
    intro: '"العادات لا تختفي أبداً، بل تُستبدل. افهم حلقة العادة لتغير حياتك."',
    lessons: [
      { title: 'حلقة العادة', text: 'كل عادة تتكون من: إشارة، روتين، ومكافأة. لتغيير العادة، غير الروتين فقط.' },
      { title: 'العادات المحورية', text: 'هناك عادات (كالرياضة) تغييرها يطلق سلسلة تفاعلات تغير باقي حياتك.' },
      { title: 'قوة الإرادة', text: 'الإرادة كالعضلة، تتعب بالاستخدام. درّبها وحافظ عليها لأهم القرارات.' }
    ]
  },
  {
    id: '10x', title: 'القاعدة 10 أضعاف', author: 'جرانت كاردون', icon: Flame, color: '#d35400',
    tagline: 'الفرق بين النجاح العادي والساحق',
    intro: '"حدد أهدافاً أكبر بـ 10 مرات مما تعتقد أنك تريده، ثم قم بـ 10 أضعاف العمل المطلوب."',
    lessons: [
      { title: 'الفعل الهائل', text: 'المستويات الثلاثة للفعل لا تكفي (لا تفعل شيء، تراجع، فعل عادي). فقط الفعل الهائل يضمن النجاح.' },
      { title: 'الأهداف الضخمة', text: 'الأهداف الصغيرة لا تحفزك. اجعل أهدافك تبدو مستحيلة للآخرين لتستخرج أفضل ما لديك.' },
      { title: 'تحمل المسؤولية', text: 'لا تلقِ اللوم على الاقتصاد أو الظروف. أنت وحدك المسؤول عن كل شيء في حياتك.' }
    ]
  },
  {
    id: 'now', title: 'قوة الآن', author: 'إيكهارت تول', icon: Sparkles, color: '#27ae60',
    tagline: 'الدليل للتنوير الروحي',
    intro: '"أنت لست عقلك. اللحظة الحالية هي كل ما تملكه حقاً في هذه الحياة."',
    lessons: [
      { title: 'الماضي والمستقبل وهم', text: 'الماضي ذاكرة، والمستقبل خيال. القوة الحقيقية تكمن في تركيزك على "الآن".' },
      { title: 'مراقبة العقل', text: 'تعلم كيف تراقب أفكارك دون أن تحكم عليها أو تتماهى معها.' },
      { title: 'قبول اللحظة', text: 'أياً كان ما تحتويه اللحظة الحالية، اقبلها كما لو كنت قد اخترتها.' }
    ]
  },
  {
    id: 'subtle', title: 'فن اللامبالاة', author: 'مارك مانسون', icon: Smile, color: '#e74c3c',
    tagline: 'العيش حياة تخالف المألوف',
    intro: '"لست مضطراً لتكون إيجابياً طوال الوقت. سر الحياة هو أن تهتم بما هو حقيقي ومهم فقط."',
    lessons: [
      { title: 'اختيار المعاناة', text: 'كل شيء يتطلب معاناة. السؤال الأهم: ما هي المعاناة التي ترغب في تحملها لأجل هدفك؟' },
      { title: 'أنت لست استثنائياً', text: 'قبولك لكونك شخصاً عادياً يزيل الضغط النفسي ويجعلك حراً للعمل بشغف حقيقي.' },
      { title: 'قانون التراجع', text: 'كلما ركضت وراء الشعور بالسعادة، زاد شعورك بالتعاسة. تقبل السلبيات هو تجربة إيجابية.' }
    ]
  },
  {
    id: '8020', title: 'مبدأ 80/20', author: 'ريتشارد كوش', icon: LineChart, color: '#2980b9',
    tagline: 'سر تحقيق المزيد بجهد أقل',
    intro: '"80% من النتائج تأتي من 20% من الأسباب. ركز على القلة الحيوية وتجاهل الكثرة التافهة."',
    lessons: [
      { title: 'في العمل', text: 'اكتشف الـ 20% من المهام التي تجلب لك 80% من النجاح، وركز عليها حصرياً.' },
      { title: 'في العلاقات', text: '20% من أصدقائك يمنحونك 80% من الدعم والسعادة. استثمر وقتك معهم.' },
      { title: 'التفويض والترك', text: 'لا تتردد في حذف الـ 80% من الأعمال التي تضيع وقتك ولا تثمر سوى 20%.' }
    ]
  },
  {
    id: 'babylon', title: 'أغنى رجل في بابل', author: 'جورج كلاسون', icon: Shield, color: '#d4af37',
    tagline: 'أسرار النجاح المالي القديمة',
    intro: '"جزء من كل ما تكسبه هو لك لتحتفظ به. ادفع لنفسك أولاً."',
    lessons: [
      { title: 'ادفع لنفسك أولاً', text: 'وفر 10% على الأقل من دخلك قبل دفع أي التزامات أخرى.' },
      { title: 'تحكم في نفقاتك', text: 'الرغبات تنمو دائماً لتساوي الدخل. تعلم التفريق بين الاحتياجات والرغبات.' },
      { title: 'اجعل مالك يتضاعف', text: 'لا تترك مدخراتك راكدة. استثمرها بحكمة لتتضاعف كالقطيع.' }
    ]
  },
  {
    id: 'essentialism', title: 'الجوهرية', author: 'جريج ماكيون', icon: Crosshair, color: '#16a085',
    tagline: 'السعي المنضبط نحو الأقل',
    intro: '"الجوهرية ليست كيفية إنجاز المزيد، بل كيفية إنجاز الأشياء الصحيحة فقط."',
    lessons: [
      { title: 'قوة كلمة (لا)', text: 'إذا لم تكن الإجابة (نعم قاطعة)، فهي (لا). لا تقبل بأنصاف الفرص.' },
      { title: 'التركيز المطلق', text: 'لا يمكنك التقدم في 10 اتجاهات بخطوة واحدة. تقدم 10 خطوات في اتجاه واحد.' },
      { title: 'تصميم الروتين', text: 'الروتين الجيد يجعل تنفيذ الأشياء الهامة أمراً سهلاً وتلقائياً.' }
    ]
  },
  {
    id: 'monk', title: 'فكر كأنك راهب', author: 'جاي شيتي', icon: ShieldCheck, color: '#8d6e63',
    tagline: 'تدريب العقل للسلام والهدف',
    intro: '"لا تكن أسيراً لما يعتقده الآخرون عنك. الراهب يعيش بهدف حقيقي وسلام داخلي."',
    lessons: [
      { title: 'التخلي عن السلبية', text: 'الشكوى والتذمر تسمم العقل. تحرر من الحاجة لتغيير الآخرين.' },
      { title: 'اكتشاف الدارما (الشغف)', text: 'استخدم مهاراتك الطبيعية في خدمة الآخرين. هنا يكمن الشغف الحقيقي.' },
      { title: 'الروتين الصباحي', text: 'كيف تبدأ يومك يحدد مساره. خصص وقتاً للامتنان والتأمل والقراءة يومياً.' }
    ]
  },
  {
    id: 'eq', title: 'الذكاء العاطفي', author: 'دانيال جولمان', icon: HandHeart, color: '#ec407a',
    tagline: 'لماذا يمكن أن يكون أهم من الذكاء (IQ)',
    intro: '"قدرتك على التحكم في عواطفك وإدارتها هي المؤشر أكبر لنجاحك في الحياة."',
    lessons: [
      { title: 'الوعي الذاتي', text: 'القدرة على فهم مشاعرك لحظة حدوثها وتأثيرها على تصرفاتك.' },
      { title: 'التحكم الذاتي', text: 'لا تدع الغضب أو الإحباط يتحكم في ردود أفعالك. فكر قبل أن تستجيب.' },
      { title: 'التعاطف', text: 'فهم مشاعر الآخرين وبناء علاقات إيجابية هو مفتاح القيادة الناجحة.' }
    ]
  },
  {
    id: 'startwhy', title: 'ابدأ بلماذا', author: 'سيمون سينك', icon: Star, color: '#3f51b5',
    tagline: 'كيف يلهم القادة العظماء الجميع',
    intro: '"الناس لا يشترون (ماذا) تفعل، بل يشترون (لماذا) تفعل ذلك."',
    lessons: [
      { title: 'الدائرة الذهبية', text: 'دائماً ابدأ بالسبب (لماذا)، ثم الآلية (كيف)، ثم النتيجة (ماذا).' },
      { title: 'الإلهام مقابل التلاعب', text: 'الإلهام يخلق ولاءً طويل الأمد، التلاعب يعطي نتائج مؤقتة.' },
      { title: 'الثقة', text: 'الثقة تنشأ عندما يرى الناس أن أفعالك تتطابق مع قيمك و(لماذا) الخاصة بك.' }
    ]
  },
  {
    id: 'blueocean', title: 'المحيط الأزرق', author: 'دابليو تشان كيم', icon: Compass, color: '#03a9f4',
    tagline: 'خلق أسواق جديدة بلا منافسة',
    intro: '"توقف عن التنافس في المحيطات الحمراء الدموية، واخلق محيطك الأزرق الخاص."',
    lessons: [
      { title: 'المحيط الأحمر', text: 'هو السوق الحالي المليء بالمنافسة والأسعار المنخفضة. تجنبه.' },
      { title: 'خلق الطلب', text: 'بدل التركيز على هزيمة المنافس، ركز على جعل المنافسة غير ذات صلة بتقديم قيمة فريدة.' },
      { title: 'الابتكار القيمي', text: 'رفع قيمة المنتج للعميل مع خفض التكاليف في نفس الوقت.' }
    ]
  },
  {
    id: 'thinkagain', title: 'فكر مرة أخرى', author: 'آدم جرانت', icon: Brain, color: '#9c27b0',
    tagline: 'قوة معرفة ما لا تعرفه',
    intro: '"الغطرسة هي العماء، والتواضع الفكري هو الرؤية الواضحة."',
    lessons: [
      { title: 'إعادة التفكير', text: 'في عالم سريع التغير، القدرة على التخلي عن قناعاتك القديمة أهم من التمسك بها.' },
      { title: 'متلازمة المحتال', text: 'الشعور بأنك لست خبيراً يدفعك للتعلم المستمر، وهو أفضل من الثقة الزائفة.' },
      { title: 'الفرح بأن تكون مخطئاً', text: 'عندما تكتشف خطأك، افرح! فهذا يعني أنك أصبحت أكثر حكمة الآن.' }
    ]
  }
];

export default function WisdomView() {
  const { t } = useTranslation();
  const [activeBookId, setActiveBookId] = useState(BOOKS_DB[0].id);

  const activeBook = BOOKS_DB.find(b => b.id === activeBookId);

  return (
    <div className="wisdom-view animate-fade-up">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <BookMarked size={64} style={{ marginBottom: '1rem', opacity: 0.8, color: 'var(--text-primary)' }} />
        <h1 className="text-gradient">{t('wisdom.title')}</h1>
        <div className="quote-text" style={{ fontSize: '1.3rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>{t('wisdom.quote')}</div>
      </div>

      {/* Book Tabs - Horizontal Scroll */}
      <div className="glass-panel delay-1 animate-fade-up" style={{ padding: '1.5rem', marginBottom: '3rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: '1rem', minWidth: 'max-content' }}>
          {BOOKS_DB.map(book => {
            const Icon = book.icon;
            const isActive = activeBookId === book.id;
            return (
              <button
                key={book.id}
                onClick={() => setActiveBookId(book.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '1rem 2rem',
                  background: isActive ? 'var(--glass-highlight)' : 'var(--surface-color)',
                  border: isActive ? `1px solid ${book.color}` : '1px solid var(--surface-border)',
                  borderRadius: '12px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: isActive ? `0 0 15px ${book.color}33` : 'none',
                  minWidth: '220px',
                  justifyContent: 'flex-start'
                }}
              >
                <div style={{ background: isActive ? book.color : 'transparent', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.3s' }}>
                  <Icon size={24} color={isActive ? 'var(--bg-color)' : book.color} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: isActive ? 'bold' : 'normal', fontSize: '1.1rem' }}>{book.title}</div>
                  <div style={{ fontSize: '0.85rem', color: isActive ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{book.author}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Book Content Rendering */}
      {activeBook && (
        <div className="delay-2 animate-fade-up glass-panel" style={{ padding: '3rem', borderTop: `4px solid ${activeBook.color}` }}>
          <h2 style={{ color: activeBook.color, marginBottom: '0.5rem', fontSize: '2.2rem' }}>{activeBook.title}</h2>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1.5rem', opacity: 0.8 }}>- {activeBook.tagline}</h4>
          
          <p style={{ fontSize: '1.25rem', lineHeight: '1.8', color: 'var(--text-secondary)', marginBottom: '3rem', borderRight: `3px solid ${activeBook.color}`, paddingRight: '1rem', fontStyle: 'italic' }}>
            {activeBook.intro}
          </p>
          
          <div className="cards-grid">
            {activeBook.lessons.map((lesson, idx) => (
              <div key={idx} style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--surface-border)', transition: 'transform 0.3s' }} className="feature-card-hover">
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bookmark size={20} color={activeBook.color} /> {lesson.title}
                </h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1.05rem' }}>{lesson.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

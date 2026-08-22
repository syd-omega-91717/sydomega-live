/* ═══════════════════════════════════════════════════════════════════════════
   Ω SYD OMEGA 91717 — GLOBAL i18n ENGINE
   Languages: EN · AR · FR · ES · NL · ZH · HI
   Usage: add data-i18n="key" to any element.
   RTL: Arabic auto-sets dir="rtl" on <html>.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
var LANGS={
  en:{dir:'ltr',label:'EN',name:'English'},
  ar:{dir:'rtl',label:'AR',name:'العربية'},
  fr:{dir:'ltr',label:'FR',name:'Français'},
  es:{dir:'ltr',label:'ES',name:'Español'},
  nl:{dir:'ltr',label:'NL',name:'Nederlands'},
  zh:{dir:'ltr',label:'ZH',name:'中文'},
  hi:{dir:'ltr',label:'HI',name:'हिन्दी'}
};

var T={
/* ── GLOBAL NAV & UI ── */
nav_dashboard:        {en:'Dashboard',ar:'لوحة التحكم',fr:'Tableau de bord',es:'Panel',nl:'Dashboard',zh:'仪表盘',hi:'डैशबोर्ड'},
nav_profile:          {en:'Profile',ar:'الملف الشخصي',fr:'Profil',es:'Perfil',nl:'Profiel',zh:'个人资料',hi:'प्रोफ़ाइल'},
nav_matrix:           {en:'Matrix',ar:'المصفوفة',fr:'Matrice',es:'Matriz',nl:'Matrix',zh:'矩阵',hi:'मैट्रिक्स'},
nav_vault:            {en:'Vault',ar:'الخزانة',fr:'Coffre',es:'Bóveda',nl:'Kluis',zh:'金库',hi:'वॉल्ट'},
nav_family:           {en:'Family',ar:'العائلة',fr:'Famille',es:'Familia',nl:'Familie',zh:'家族',hi:'परिवार'},
nav_portfolio:        {en:'Portfolio',ar:'المحفظة',fr:'Portefeuille',es:'Portafolio',nl:'Portfolio',zh:'作品集',hi:'पोर्टफोलियो'},
nav_cosmos:           {en:'Cosmos',ar:'الكون',fr:'Cosmos',es:'Cosmos',nl:'Kosmos',zh:'宇宙',hi:'ब्रह्मांड'},
nav_social:           {en:'Social',ar:'التواصل',fr:'Social',es:'Social',nl:'Sociaal',zh:'社交',hi:'सोशल'},
nav_subscriptions:    {en:'Membership',ar:'العضوية',fr:'Adhésion',es:'Membresía',nl:'Lidmaatschap',zh:'会员',hi:'सदस्यता'},
nav_settings:         {en:'Settings',ar:'الإعدادات',fr:'Paramètres',es:'Configuración',nl:'Instellingen',zh:'设置',hi:'सेटिंग्स'},
nav_logout:           {en:'Sign Out',ar:'تسجيل الخروج',fr:'Déconnexion',es:'Cerrar sesión',nl:'Uitloggen',zh:'退出',hi:'साइन आउट'},

/* ── SIDEBAR SECTION LABELS (nav.js's 15 top-level sections) ── */
nav_sec_command:      {en:'Command',ar:'القيادة',fr:'Commande',es:'Comando',nl:'Commando',zh:'指挥',hi:'कमान'},
nav_sec_identity:     {en:'Identity',ar:'الهوية',fr:'Identité',es:'Identidad',nl:'Identiteit',zh:'身份',hi:'पहचान'},
nav_sec_ascend:       {en:'Ascend',ar:'الصعود',fr:'Ascension',es:'Ascender',nl:'Stijgen',zh:'晋升',hi:'आरोहण'},
nav_sec_cosmos:       {en:'Cosmos',ar:'الكون',fr:'Cosmos',es:'Cosmos',nl:'Kosmos',zh:'宇宙',hi:'ब्रह्मांड'},
nav_sec_universe:     {en:'Universe',ar:'الكون الأعظم',fr:'Univers',es:'Universo',nl:'Heelal',zh:'天地',hi:'जगत'},
nav_sec_vault:        {en:'Vault',ar:'الخزنة',fr:'Coffre',es:'Bóveda',nl:'Kluis',zh:'金库',hi:'तिजोरी'},
nav_sec_order:        {en:'Order',ar:'النظام',fr:'Ordre',es:'Orden',nl:'Orde',zh:'秩序',hi:'व्यवस्था'},
nav_sec_services:     {en:'Services',ar:'الخدمات',fr:'Services',es:'Servicios',nl:'Diensten',zh:'服务',hi:'सेवाएं'},
nav_sec_intel:        {en:'Intel',ar:'الاستخبارات',fr:'Renseignement',es:'Inteligencia',nl:'Inlichtingen',zh:'情报',hi:'सूचना'},
nav_sec_arena:        {en:'Arena',ar:'الساحة',fr:'Arène',es:'Arena',nl:'Arena',zh:'竞技场',hi:'अखाड़ा'},
nav_sec_govern:       {en:'Govern',ar:'الحوكمة',fr:'Gouvernance',es:'Gobernanza',nl:'Bestuur',zh:'治理',hi:'शासन'},
nav_sec_invest:       {en:'Invest',ar:'الاستثمار',fr:'Investir',es:'Invertir',nl:'Investeren',zh:'投资',hi:'निवेश'},
nav_sec_achieve:      {en:'Achieve',ar:'الإنجاز',fr:'Réussite',es:'Logros',nl:'Prestaties',zh:'成就',hi:'उपलब्धि'},
nav_sec_archive:      {en:'Archive',ar:'الأرشيف',fr:'Archive',es:'Archivo',nl:'Archief',zh:'档案',hi:'अभिलेख'},
nav_sec_media:        {en:'Media',ar:'الإعلام',fr:'Médias',es:'Medios',nl:'Media',zh:'媒体',hi:'मीडिया'},

/* ── COMMAND SECTION SUB-NAV ── */
sub_account:          {en:'Account',ar:'الحساب',fr:'Compte',es:'Cuenta',nl:'Account',zh:'账户',hi:'खाता'},
sub_settings:         {en:'Settings',ar:'الإعدادات',fr:'Paramètres',es:'Configuración',nl:'Instellingen',zh:'设置',hi:'सेटिंग्स'},
sub_zodiac:           {en:'Zodiac',ar:'البروج',fr:'Zodiaque',es:'Zodiaco',nl:'Dierenriem',zh:'星座',hi:'राशि चक्र'},

/* ── IDENTITY SECTION SUB-NAV ── */
sub_identity:         {en:'Identity',ar:'الهوية',fr:'Identité',es:'Identidad',nl:'Identiteit',zh:'身份',hi:'पहचान'},
sub_horoscope:        {en:'Horoscope',ar:'الأبراج',fr:'Horoscope',es:'Horóscopo',nl:'Horoscoop',zh:'星座运势',hi:'राशिफल'},
sub_character:        {en:'Character',ar:'الشخصية',fr:'Caractère',es:'Carácter',nl:'Karakter',zh:'人物',hi:'चरित्र'},
sub_sigil:            {en:'Sigil',ar:'الشعار',fr:'Sceau',es:'Sello',nl:'Zegel',zh:'印章',hi:'मुहर'},

/* ── ASCEND SECTION SUB-NAV ── */
sub_evolution:        {en:'Evolution',ar:'التطور',fr:'Évolution',es:'Evolución',nl:'Evolutie',zh:'进化',hi:'विकास'},
sub_gates:            {en:'Gates',ar:'البوابات',fr:'Portes',es:'Puertas',nl:'Poorten',zh:'门',hi:'द्वार'},
sub_phases:           {en:'Phases',ar:'المراحل',fr:'Phases',es:'Fases',nl:'Fasen',zh:'阶段',hi:'चरण'},

/* ── COSMOS SECTION SUB-NAV ── */
sub_elements:         {en:'Elements',ar:'العناصر',fr:'Éléments',es:'Elementos',nl:'Elementen',zh:'元素',hi:'तत्व'},
sub_factions:         {en:'Factions',ar:'الفصائل',fr:'Factions',es:'Facciones',nl:'Facties',zh:'阵营',hi:'गुट'},
sub_houses:           {en:'Houses',ar:'البيوت',fr:'Maisons',es:'Casas',nl:'Huizen',zh:'家族',hi:'घराने'},
sub_tribes:           {en:'Tribes',ar:'القبائل',fr:'Tribus',es:'Tribus',nl:'Stammen',zh:'部落',hi:'कबीले'},

/* ── UNIVERSE SECTION SUB-NAV ── */
sub_constellations:   {en:'Constellations',ar:'الأبراج',fr:'Constellations',es:'Constelaciones',nl:'Sterrenbeelden',zh:'星座群',hi:'नक्षत्र'},
sub_nexus:            {en:'Nexus',ar:'مركز',fr:'Nexus',es:'Nexo',nl:'Nexus',zh:'联系点',hi:'जंक्शन'},
sub_network:          {en:'Network',ar:'الشبكة',fr:'Réseau',es:'Red',nl:'Netwerk',zh:'网络',hi:'नेटवर्क'},

/* ── VAULT SECTION SUB-NAV ── */
sub_assets:           {en:'Assets',ar:'الأصول',fr:'Actifs',es:'Activos',nl:'Activa',zh:'资产',hi:'संपत्ति'},
sub_nfts:             {en:'NFTs',ar:'الرموز',fr:'NFTs',es:'NFTs',nl:'NFTs',zh:'NFT',hi:'एनएफटी'},
sub_collections:      {en:'Collections',ar:'المجموعات',fr:'Collections',es:'Colecciones',nl:'Collecties',zh:'收藏',hi:'संग्रह'},

/* ── ORDER SECTION SUB-NAV ── */
sub_contracts:        {en:'Contracts',ar:'العقود',fr:'Contrats',es:'Contratos',nl:'Contracten',zh:'合同',hi:'अनुबंध'},
sub_agreements:       {en:'Agreements',ar:'الاتفاقيات',fr:'Accords',es:'Acuerdos',nl:'Overeenkomsten',zh:'协议',hi:'समझौते'},
sub_scheduling:       {en:'Scheduling',ar:'الجدولة',fr:'Planification',es:'Programación',nl:'Planning',zh:'日程',hi:'शेड्यूलिंग'},
sub_automation:       {en:'Automation',ar:'الأتمتة',fr:'Automatisation',es:'Automatización',nl:'Automatisering',zh:'自动化',hi:'स्वचालन'},

/* ── SERVICES SECTION SUB-NAV ── */
sub_marketplace:      {en:'Marketplace',ar:'السوق',fr:'Marché',es:'Mercado',nl:'Marktplaats',zh:'市场',hi:'बाज़ार'},
sub_consultancy:      {en:'Consultancy',ar:'الاستشارة',fr:'Conseil',es:'Consultoría',nl:'Adviesbureaus',zh:'咨询',hi:'सलाह'},
sub_concierge:        {en:'Concierge',ar:'بواب',fr:'Conciergerie',es:'Conserjería',nl:'Portier',zh:'礼宾',hi:'द्वारपाल'},

/* ── INTEL SECTION SUB-NAV ── */
sub_analytics:        {en:'Analytics',ar:'التحليلات',fr:'Analyse',es:'Análisis',nl:'Analytiek',zh:'分析',hi:'विश्लेषण'},
sub_intelligence:     {en:'Intelligence',ar:'الذكاء',fr:'Renseignement',es:'Inteligencia',nl:'Intelligentie',zh:'智能',hi:'बुद्धिमत्ता'},
sub_signals:          {en:'Signals',ar:'الإشارات',fr:'Signaux',es:'Señales',nl:'Signalen',zh:'信号',hi:'संकेत'},
sub_threat:           {en:'Threat',ar:'التهديد',fr:'Menace',es:'Amenaza',nl:'Bedreiging',zh:'威胁',hi:'खतरा'},

/* ── ARENA SECTION SUB-NAV ── */
sub_gaming:           {en:'Gaming',ar:'الألعاب',fr:'Jeux',es:'Juegos',nl:'Gaming',zh:'游戏',hi:'गेमिंग'},
sub_challenges:       {en:'Challenges',ar:'التحديات',fr:'Défis',es:'Desafíos',nl:'Uitdagingen',zh:'挑战',hi:'चुनौतियाँ'},
sub_leaderboards:     {en:'Leaderboards',ar:'جداول الترتيب',fr:'Classements',es:'Clasificaciones',nl:'Ranglijsten',zh:'排行榜',hi:'लीडरबोर्ड'},

/* ── GOVERN SECTION SUB-NAV ── */
sub_governance:       {en:'Governance',ar:'الحوكمة',fr:'Gouvernance',es:'Gobernanza',nl:'Bestuur',zh:'治理',hi:'शासन'},
sub_council:          {en:'Council',ar:'المجلس',fr:'Conseil',es:'Consejo',nl:'Raad',zh:'委员会',hi:'परिषद'},
sub_compliance:       {en:'Compliance',ar:'الامتثال',fr:'Conformité',es:'Cumplimiento',nl:'Naleving',zh:'合规',hi:'अनुपालन'},

/* ── INVEST SECTION SUB-NAV ── */
sub_investment:       {en:'Investment',ar:'الاستثمار',fr:'Investissement',es:'Inversión',nl:'Investering',zh:'投资',hi:'निवेश'},
sub_treasury:         {en:'Treasury',ar:'الخزانة',fr:'Trésorerie',es:'Tesorería',nl:'Schatkist',zh:'财政',hi:'कोष'},
sub_revenue:          {en:'Revenue',ar:'الإيرادات',fr:'Revenu',es:'Ingresos',nl:'Inkomsten',zh:'收益',hi:'राजस्व'},
sub_wealth:           {en:'Wealth',ar:'الثروة',fr:'Richesse',es:'Riqueza',nl:'Welvaart',zh:'财富',hi:'संपत्ति'},

/* ── ACHIEVE SECTION SUB-NAV ── */
sub_awards:           {en:'Awards',ar:'الجوائز',fr:'Récompenses',es:'Premios',nl:'Prijzen',zh:'奖项',hi:'पुरस्कार'},

/* ── ARCHIVE SECTION SUB-NAV ── */
sub_heritage:         {en:'Heritage',ar:'التراث',fr:'Patrimoine',es:'Patrimonio',nl:'Erfgoed',zh:'遗产',hi:'विरासत'},
sub_bloodline:        {en:'Bloodline',ar:'النسب',fr:'Lignée',es:'Linaje',nl:'Stamboom',zh:'血统',hi:'वंशावली'},
sub_history:          {en:'History',ar:'التاريخ',fr:'Historique',es:'Historial',nl:'Geschiedenis',zh:'历史',hi:'इतिहास'},

/* ── MEDIA SECTION SUB-NAV ── */
sub_cinema:           {en:'Cinema',ar:'السينما',fr:'Cinéma',es:'Cine',nl:'Bioscoop',zh:'电影',hi:'सिनेमा'},
sub_series:           {en:'Series',ar:'السلسلة',fr:'Série',es:'Serie',nl:'Serie',zh:'系列',hi:'श्रृंखला'},
sub_news:             {en:'News',ar:'الأخبار',fr:'Actualités',es:'Noticias',nl:'Nieuws',zh:'新闻',hi:'समाचार'},
sub_events:           {en:'Events',ar:'الأحداث',fr:'Événements',es:'Eventos',nl:'Evenementen',zh:'活动',hi:'घटनाएं'},

/* ── AUTH ── */
sign_in:              {en:'Sign In',ar:'تسجيل الدخول',fr:'Se connecter',es:'Iniciar sesión',nl:'Inloggen',zh:'登录',hi:'साइन इन'},
sign_up:              {en:'Register',ar:'التسجيل',fr:'S\'inscrire',es:'Registrarse',nl:'Registreren',zh:'注册',hi:'पंजीकरण'},
email:                {en:'Email',ar:'البريد الإلكتروني',fr:'E-mail',es:'Correo',nl:'E-mail',zh:'电子邮件',hi:'ईमेल'},
password:             {en:'Password',ar:'كلمة المرور',fr:'Mot de passe',es:'Contraseña',nl:'Wachtwoord',zh:'密码',hi:'पासवर्ड'},
welcome_back:         {en:'Welcome Back',ar:'مرحباً بعودتك',fr:'Bon retour',es:'Bienvenido de vuelta',nl:'Welkom terug',zh:'欢迎回来',hi:'वापसी पर स्वागत'},

/* ── MATRIX ── */
matrix_title:         {en:'The Matrix',ar:'المصفوفة',fr:'La Matrice',es:'La Matriz',nl:'De Matrix',zh:'矩阵',hi:'मैट्रिक्स'},
axis_knowledge:       {en:'Knowledge',ar:'المعرفة',fr:'Connaissance',es:'Conocimiento',nl:'Kennis',zh:'知识',hi:'ज्ञान'},
axis_mastery:         {en:'Mastery',ar:'الإتقان',fr:'Maîtrise',es:'Maestría',nl:'Meesterschap',zh:'精通',hi:'दक्षता'},
axis_contribution:    {en:'Contribution',ar:'المساهمة',fr:'Contribution',es:'Contribución',nl:'Bijdrage',zh:'贡献',hi:'योगदान'},
nodes:                {en:'Nodes',ar:'العقد',fr:'Nœuds',es:'Nodos',nl:'Knooppunten',zh:'节点',hi:'नोड्स'},
authority:            {en:'Authority',ar:'السلطة',fr:'Autorité',es:'Autoridad',nl:'Autoriteit',zh:'权威',hi:'अधिकार'},
apex:                 {en:'Apex',ar:'القمة',fr:'Sommet',es:'Ápice',nl:'Apex',zh:'顶点',hi:'शीर्ष'},

/* ── PROFILE ── */
profile_title:        {en:'Sovereign Profile',ar:'الملف السيادي',fr:'Profil Souverain',es:'Perfil Soberano',nl:'Soeverein Profiel',zh:'主权档案',hi:'सार्वभौम प्रोफ़ाइल'},
your_cosmology:       {en:'Your Cosmology',ar:'علم الكون الخاص بك',fr:'Votre Cosmologie',es:'Tu Cosmología',nl:'Uw Kosmologie',zh:'你的宇宙学',hi:'आपकी ब्रह्मांड विज्ञान'},
sign:                 {en:'Sign',ar:'البرج',fr:'Signe',es:'Signo',nl:'Teken',zh:'星座',hi:'राशि'},
element:              {en:'Element',ar:'العنصر',fr:'Élément',es:'Elemento',nl:'Element',zh:'元素',hi:'तत्व'},
olympian:             {en:'Olympian',ar:'الأولمبي',fr:'Olympien',es:'Olímpico',nl:'Olympiër',zh:'奥林匹亚',hi:'ओलंपियन'},
agent:                {en:'Agent',ar:'العميل',fr:'Agent',es:'Agente',nl:'Agent',zh:'代理',hi:'एजेंट'},
token:                {en:'Token',ar:'الرمز',fr:'Jeton',es:'Token',nl:'Token',zh:'代币',hi:'टोकन'},

	/* ── PROFILE TABS ── */
	profile_tab_overview: {en:'Overview',ar:'نظرة عامة',fr:'Aperçu',es:'Descripción general',nl:'Overzicht',zh:'概览',hi:'अवलोकन'},
	profile_tab_identity: {en:'Identity',ar:'الهوية',fr:'Identité',es:'Identidad',nl:'Identiteit',zh:'身份',hi:'पहचान'},
	profile_tab_passport:{en:'Passport',ar:'جواز السفر',fr:'Passeport',es:'Pasaporte',nl:'Paspoort',zh:'护照',hi:'पासपोर्ट'},
	profile_tab_science: {en:'Science',ar:'العلم',fr:'Science',es:'Ciencia',nl:'Wetenschap',zh:'科学',hi:'विज्ञान'},

	/* ── PROFILE STATS ── */
	profile_stat_authority: {en:'Authority Score',ar:'درجة السلطة',fr:'Score d\'autorité',es:'Puntuación de autoridad',nl:'Gezagsscores',zh:'权力评分',hi:'अधिकार स्कोर'},
	profile_stat_matrix_coord: {en:'Matrix Coordinates',ar:'إحداثيات المصفوفة',fr:'Coordonnées Matrice',es:'Coordenadas Matriz',nl:'Matrixcoördinaten',zh:'矩阵坐标',hi:'मैट्रिक्स निर्देशांक'},
	profile_stat_material_tier: {en:'Material Tier',ar:'المستوى المادي',fr:'Niveau Matériel',es:'Nivel Material',nl:'Materiële laag',zh:'物质级别',hi:'भौतिक स्तर'},
	profile_stat_grade: {en:'Grade Level',ar:'مستوى الصف',fr:'Niveau Scolaire',es:'Nivel de Grado',nl:'Klasniveau',zh:'等级水平',hi:'ग्रेड स्तर'},
	profile_stat_achievements: {en:'Achievements',ar:'الإنجازات',fr:'Réalisations',es:'Logros',nl:'Prestaties',zh:'成就',hi:'उपलब्धियाँ'},
	profile_stat_membership: {en:'Membership',ar:'العضوية',fr:'Adhésion',es:'Membresía',nl:'Lidmaatschap',zh:'会员资格',hi:'सदस्यता'},

	/* ── PROFILE FIELDS ── */
	profile_field_full_name: {en:'Full Name',ar:'الاسم الكامل',fr:'Nom complet',es:'Nombre completo',nl:'Volledige naam',zh:'全名',hi:'पूरा नाम'},
	profile_field_platform_sign: {en:'Zodiac Sign',ar:'برج الأبراج',fr:'Signe Zodiaque',es:'Signo Zodiacal',nl:'Dierenriemteken',zh:'星座',hi:'राशि चिन्ह'},
	profile_field_agent_assigned: {en:'Agent Assigned',ar:'الوكيل المعين',fr:'Agent Attribué',es:'Agente Asignado',nl:'Toegewezen agent',zh:'分配代理',hi:'निर्दिष्ट एजेंट'},
	profile_field_sovereign_token: {en:'Sovereign Token',ar:'الرمز السيادي',fr:'Jeton Souverain',es:'Token Soberano',nl:'Soeverein Token',zh:'主权令牌',hi:'संप्रभु टोकन'},

	/* ── PROFILE SECTIONS ── */
	profile_section_matrix_axes: {en:'Matrix Axes',ar:'محاور المصفوفة',fr:'Axes de la Matrice',es:'Ejes de la Matriz',nl:'Matrixassen',zh:'矩阵轴',hi:'मैट्रिक्स अक्ष'},
	profile_section_achievements: {en:'Achievements',ar:'الإنجازات',fr:'Réalisations',es:'Logros',nl:'Prestaties',zh:'成就',hi:'उपलब्धियाँ'},
	profile_section_certificates: {en:'Certificates',ar:'الشهادات',fr:'Certificats',es:'Certificados',nl:'Certificaten',zh:'证书',hi:'प्रमाण पत्र'},

	/* ── PROFILE AXES ── */
	profile_axis_a: {en:'Axis A',ar:'المحور أ',fr:'Axe A',es:'Eje A',nl:'As A',zh:'轴A',hi:'अक्ष A'},
	profile_axis_b: {en:'Axis B',ar:'المحور ب',fr:'Axe B',es:'Eje B',nl:'As B',zh:'轴B',hi:'अक्ष B'},
	profile_axis_c: {en:'Axis C',ar:'المحور ج',fr:'Axe C',es:'Eje C',nl:'As C',zh:'轴C',hi:'अक्ष C'},

	/* ── PROFICIENCY RANKS ── */
	profile_rank_initiate: {en:'Initiate',ar:'المبتدئ',fr:'Initié',es:'Iniciado',nl:'Initiaat',zh:'新手',hi:'आरंभकर्ता'},
	profile_rank_seeker: {en:'Seeker',ar:'الباحث',fr:'Chercheur',es:'Buscador',nl:'Zoeker',zh:'求道者',hi:'साधक'},
	profile_rank_adept: {en:'Adept',ar:'الماهر',fr:'Adepte',es:'Adepto',nl:'Adept',zh:'熟练者',hi:'निपुण'},
	profile_rank_expert: {en:'Expert',ar:'الخبير',fr:'Expert',es:'Experto',nl:'Expert',zh:'专家',hi:'विशेषज्ञ'},
	profile_rank_master: {en:'Master',ar:'الماجستير',fr:'Maître',es:'Maestro',nl:'Meester',zh:'大师',hi:'मास्टर'},
	profile_rank_elite: {en:'Elite',ar:'النخبة',fr:'Élite',es:'Élite',nl:'Elite',zh:'精英',hi:'अभिजात वर्ग'},
	profile_rank_sovereign: {en:'Sovereign',ar:'السيد',fr:'Souverain',es:'Soberano',nl:'Soeverein',zh:'主权者',hi:'संप्रभु'},
	profile_rank_legend: {en:'Legend',ar:'الأسطورة',fr:'Légende',es:'Leyenda',nl:'Legende',zh:'传奇',hi:'किंवदंती'},
	profile_rank_omega: {en:'Omega',ar:'أوميجا',fr:'Oméga',es:'Omega',nl:'Omega',zh:'欧米茄',hi:'ओमेगा'},

	/* ── MATERIAL TIERS ── */
	profile_material_sand: {en:'Sand',ar:'الرمل',fr:'Sable',es:'Arena',nl:'Zand',zh:'沙',hi:'रेत'},
	profile_material_glass: {en:'Glass',ar:'الزجاج',fr:'Verre',es:'Vidrio',nl:'Glas',zh:'玻璃',hi:'कांच'},
	profile_material_iron: {en:'Iron',ar:'الحديد',fr:'Fer',es:'Hierro',nl:'IJzer',zh:'铁',hi:'लोहा'},
	profile_material_steel: {en:'Steel',ar:'الصلب',fr:'Acier',es:'Acero',nl:'Staal',zh:'钢',hi:'स्टील'},
	profile_material_titanium: {en:'Titanium',ar:'التيتانيوم',fr:'Titane',es:'Titanio',nl:'Titanium',zh:'钛',hi:'टाइटेनियम'},
	profile_material_carbon: {en:'Carbon',ar:'الكربون',fr:'Carbone',es:'Carbono',nl:'Koolstof',zh:'碳',hi:'कार्बन'},
	profile_material_gold: {en:'Gold',ar:'الذهب',fr:'Or',es:'Oro',nl:'Goud',zh:'金',hi:'सोना'},
	profile_material_platinum: {en:'Platinum',ar:'البلاتين',fr:'Platine',es:'Platino',nl:'Platina',zh:'铂',hi:'प्लेटिनम'},
	profile_material_omega_master: {en:'Omega Master',ar:'أوميجا ماستر',fr:'Maître Oméga',es:'Maestro Omega',nl:'Omega Meester',zh:'欧米茄大师',hi:'ओमेगा मास्टर'},

	/* ── AGENTS (BY ZODIAC) ── */
	profile_agent_aries: {en:'Sentinel',ar:'الحارس',fr:'Sentinelle',es:'Centinela',nl:'Wachter',zh:'哨兵',hi:'रक्षक'},
	profile_agent_taurus: {en:'Merchant',ar:'التاجر',fr:'Marchand',es:'Comerciante',nl:'Koopman',zh:'商人',hi:'व्यापारी'},
	profile_agent_gemini: {en:'Scout',ar:'الكشاف',fr:'Éclaireur',es:'Explorador',nl:'Verkenner',zh:'侦察员',hi:'स्काउट'},
	profile_agent_cancer: {en:'Warden',ar:'الحارس الأساسي',fr:'Gardien',es:'Guardián',nl:'Bewaker',zh:'守护者',hi:'रक्षक मुखिया'},
	profile_agent_leo: {en:'Sovereign',ar:'السيد',fr:'Souverain',es:'Soberano',nl:'Soeverein',zh:'主权者',hi:'संप्रभु'},
	profile_agent_virgo: {en:'Auditor',ar:'المدقق',fr:'Auditeur',es:'Auditor',nl:'Auditor',zh:'审计员',hi:'लेखा परीक्षक'},
	profile_agent_libra: {en:'Proxy',ar:'الوسيط',fr:'Mandataire',es:'Apoderado',nl:'Plaatsvervanger',zh:'代理人',hi:'प्रतिनिधि'},
	profile_agent_scorpio: {en:'Oracle',ar:'العرّاف',fr:'Oracle',es:'Oráculo',nl:'Orakel',zh:'神谕者',hi:'भविष्यद्वाणी'},
	profile_agent_sagittarius: {en:'Beacon',ar:'المشعل',fr:'Phare',es:'Faro',nl:'Baken',zh:'灯塔',hi:'मशाल'},
	profile_agent_capricorn: {en:'Analyst',ar:'المحلل',fr:'Analyste',es:'Analista',nl:'Analist',zh:'分析师',hi:'विश्लेषक'},
	profile_agent_aquarius: {en:'Tutor',ar:'المعلم',fr:'Tuteur',es:'Tutor',nl:'Tutor',zh:'导师',hi:'शिक्षक'},
	profile_agent_pisces: {en:'Historian',ar:'المؤرخ',fr:'Historien',es:'Historiador',nl:'Historicus',zh:'历史学家',hi:'इतिहासकार'},

	/* ── FACTIONS (BY ZODIAC) ── */
	profile_faction_aries: {en:'Aegis Order',ar:'رتبة الحماية',fr:'Ordre de l\'Égide',es:'Orden del Égida',nl:'Aegis Orde',zh:'护盾秩序',hi:'ढाल आदेश'},
	profile_faction_taurus: {en:'Gilded Hand',ar:'اليد الذهبية',fr:'Main Dorée',es:'Mano Dorada',nl:'Gouden Hand',zh:'镀金之手',hi:'सोने का हाथ'},
	profile_faction_gemini: {en:'Lumen Choir',ar:'جوقة النور',fr:'Choeur Lumineux',es:'Coro Luminoso',nl:'Lichtkoor',zh:'光之唱诗班',hi:'प्रकाश गायकदल'},
	profile_faction_cancer: {en:'Tidewardens',ar:'حراس المد',fr:'Gardiens des Marées',es:'Guardianes de las Mareas',nl:'Vloedwachters',zh:'潮汐守卫',hi:'ज्वार रक्षक'},
	profile_faction_leo: {en:'Solar Crown',ar:'التاج الشمسي',fr:'Couronne Solaire',es:'Corona Solar',nl:'Zonnekroon',zh:'太阳王冠',hi:'सूर्य मुकुट'},
	profile_faction_virgo: {en:'Grain Covenant',ar:'ميثاق الحبوب',fr:'Pacte des Moissons',es:'Pacto del Grano',nl:'Graan Verbond',zh:'谷物契约',hi:'अनाज वाचा'},
	profile_faction_libra: {en:'Forge Guild',ar:'نقابة الحدادين',fr:'Guilde des Forgerons',es:'Gremio de Herreros',nl:'Smidsgilde',zh:'铁匠工会',hi:'लोहार संघ'},
	profile_faction_scorpio: {en:'Crimson Veil',ar:'الحجاب الأحمر',fr:'Voile Pourpre',es:'Velo Carmesí',nl:'Karmijnrood Sluier',zh:'深红面纱',hi:'गहरा लाल परदा'},
	profile_faction_sagittarius: {en:'Wild Hunt',ar:'الصيد البري',fr:'Chasse Sauvage',es:'Caza Salvaje',nl:'Wilde Jacht',zh:'野性狩猎',hi:'जंगली शिकार'},
	profile_faction_capricorn: {en:'Hearth Bastion',ar:'حصن الموقد',fr:'Bastion du Foyer',es:'Bastión del Hogar',nl:'Huisbastille',zh:'家园堡垒',hi:'घर का गढ़'},
	profile_faction_aquarius: {en:'Aether Senate',ar:'مجلس الأثير',fr:'Sénat de l\'Éther',es:'Senado del Éter',nl:'Ether Senaat',zh:'以太元老院',hi:'आकाश सभा'},
	profile_faction_pisces: {en:'Deep Concord',ar:'التوافق العميق',fr:'Concorde des Profondeurs',es:'Concordia de las Profundidades',nl:'Diepe Harmonie',zh:'深度协和',hi:'गहरा सहमति'},

	/* ── KYC STEPS ── */
	profile_kyc_step_1_title: {en:'Email Verification',ar:'التحقق من البريد الإلكتروني',fr:'Vérification du courrier électronique',es:'Verificación de correo electrónico',nl:'E-mailverificatie',zh:'电子邮件验证',hi:'ईमेल सत्यापन'},
	profile_kyc_step_1_desc: {en:'Confirm your sovereign email address. A verification link has been sent upon registration.',ar:'أكد عنوان بريدك الإلكتروني السيادي. تم إرسال رابط التحقق عند التسجيل.',fr:'Confirmez votre adresse e-mail souveraine. Un lien de vérification a été envoyé lors de l\'inscription.',es:'Confirma tu dirección de correo soberana. Se envió un enlace de verificación al registrarse.',nl:'Bevestig uw soevereine e-mailadres. Een verificatiekoppeling is verzonden bij registratie.',zh:'确认您的主权电子邮件地址。注册时已发送验证链接。',hi:'अपने संप्रभु ईमेल पते की पुष्टि करें। पंजीकरण पर एक सत्यापन लिंक भेजा गया था।'},
	profile_kyc_step_1_action: {en:'Verified',ar:'التحقق',fr:'Vérifié',es:'Verificado',nl:'Geverifieerd',zh:'已验证',hi:'सत्यापित'},

	profile_kyc_step_2_title: {en:'Profile Completion',ar:'إكمال الملف الشخصي',fr:'Complétion du profil',es:'Finalización del perfil',nl:'Profielaanvulling',zh:'个人资料完成',hi:'प्रोफाइल पूर्णता'},
	profile_kyc_step_2_desc: {en:'Fill in your complete profile: full name, date of birth, zodiac sign, and nationality. Required for KYC.',ar:'أكمل ملفك الشخصي الكامل: الاسم الكامل وتاريخ الميلاد والبرج والجنسية. مطلوب لـ KYC.',fr:'Complétez votre profil complet: nom complet, date de naissance, signe du zodiaque et nationalité. Requis pour KYC.',es:'Completa tu perfil completo: nombre completo, fecha de nacimiento, signo zodiacal y nacionalidad. Requerido para KYC.',nl:'Vul uw volledige profiel in: volledige naam, geboortedatum, sterrenbeeld en nationaliteit. Vereist voor KYC.',zh:'填写您的完整资料：全名、出生日期、星座和国籍。KYC 所需。',hi:'अपनी पूर्ण प्रोफाइल भरें: पूरा नाम, जन्म तिथि, राशि और राष्ट्रीयता। KYC के लिए आवश्यक।'},
	profile_kyc_step_2_action: {en:'Complete Profile',ar:'أكمل الملف الشخصي',fr:'Complétez le profil',es:'Completar perfil',nl:'Profiel aanvullen',zh:'完成个人资料',hi:'प्रोफाइल पूरा करें'},

	profile_kyc_step_3_title: {en:'Identity Document',ar:'وثيقة الهوية',fr:'Document d\'identité',es:'Documento de identidad',nl:'Identiteitsdocument',zh:'身份文件',hi:'पहचान दस्तावेज'},
	profile_kyc_step_3_desc: {en:'Upload a government-issued ID: passport, national ID, or driver\'s licence. Must be valid and not expired.',ar:'قم بتحميل معرف صادر عن الحكومة: جواز سفر أو بطاقة هوية وطنية أو رخصة قيادة. يجب أن تكون صالحة وغير منتهية الصلاحية.',fr:'Téléchargez une pièce d\'identité délivrée par le gouvernement: passeport, carte d\'identité nationale ou permis de conduire. Doit être valide et non expiré.',es:'Carga una identificación emitida por el gobierno: pasaporte, cédula de identidad o licencia de conducir. Debe ser válida y no estar vencida.',nl:'Upload een door de regering uitgegeven identiteitsbewijs: paspoort, nationale identiteitskaart of rijbewijs. Moet geldig en niet verlopen zijn.',zh:'上传政府签发的身份证件：护照、国民身份证或驾驶执照。必须有效且未过期。',hi:'सरकार द्वारा जारी पहचान पत्र अपलोड करें: पासपोर्ट, राष्ट्रीय आईडी या ड्राइविंग लाइसेंस। सक्रिय और समाप्त नहीं होना चाहिए।'},
	profile_kyc_step_3_action: {en:'Upload Document',ar:'تحميل الوثيقة',fr:'Télécharger le document',es:'Cargar documento',nl:'Document uploaden',zh:'上传文件',hi:'दस्तावेज़ अपलोड करें'},

	profile_kyc_step_4_title: {en:'Liveness Check',ar:'فحص الحياة',fr:'Vérification de vie',es:'Verificación de vida',nl:'Vitaliteitscontrole',zh:'生活检查',hi:'जीवन जांच'},
	profile_kyc_step_4_desc: {en:'A short selfie video proves you are the person in the document. AI-assisted verification. Takes 60 seconds.',ar:'تثبت مقاطع فيديو السيلفي القصيرة أنك الشخص في الوثيقة. التحقق بمساعدة الذكاء الاصطناعي. يستغرق 60 ثانية.',fr:'Une courte vidéo selfie prouve que vous êtes la personne sur le document. Vérification assistée par l\'IA. Prend 60 secondes.',es:'Un breve video de selfie prueba que eres la persona en el documento. Verificación asistida por IA. Toma 60 segundos.',nl:'Een korte selfievideo bewijst dat u de persoon op het document bent. Verificatie ondersteund door AI. Duurt 60 seconden.',zh:'简短的自拍视频证明您是文件中的人。人工智能辅助验证。需要 60 秒。',hi:'एक छोटा सेल्फी वीडियो साबित करता है कि आप दस्तावेज़ में व्यक्ति हैं। एआई-सहायक सत्यापन। 60 सेकंड लगता है।'},
	profile_kyc_step_4_action: {en:'Start Liveness Check',ar:'ابدأ فحص الحياة',fr:'Démarrer la vérification de vie',es:'Iniciar verificación de vida',nl:'Vitaliteitscontrole starten',zh:'开始生活检查',hi:'जीवन जांच शुरू करें'},

	profile_kyc_step_5_title: {en:'Address Verification',ar:'التحقق من العنوان',fr:'Vérification d\'adresse',es:'Verificación de dirección',nl:'Adresverificatie',zh:'地址验证',hi:'पता सत्यापन'},
	profile_kyc_step_5_desc: {en:'Provide a utility bill, bank statement, or official letter dated within 90 days showing your residential address.',ar:'قدم فاتورة مرافق أو كشف حساب بنكي أو خطاب رسمي مؤرخ في غضون 90 يومًا يوضح عنوان إقامتك.',fr:'Fournissez une facture de services publics, un relevé bancaire ou une lettre officielle datant des 90 derniers jours indiquant votre adresse résidentielle.',es:'Proporciona una factura de servicios públicos, un extracto bancario o una carta oficial fechada dentro de 90 días que muestre tu dirección residencial.',nl:'Voeg een nutsbedrijf in, bankafschrift of officiële brief van de afgelopen 90 dagen met uw woonadres.',zh:'提供公用事业账单、银行对账单或官方信函，日期在 90 天内，显示您的居住地址。',hi:'एक उपयोगिता बिल, बैंक विवरण या आधिकारिक पत्र प्रदान करें जो 90 दिनों के भीतर दिनांकित है और आपका आवासीय पता दिखाता है।'},
	profile_kyc_step_5_action: {en:'Upload Proof of Address',ar:'تحميل إثبات العنوان',fr:'Télécharger la preuve d\'adresse',es:'Cargar comprobante de dirección',nl:'Adresverification uploaden',zh:'上传地址证明',hi:'पते का प्रमाण अपलोड करें'},

	profile_kyc_step_6_title: {en:'KYC Review',ar:'مراجعة KYC',fr:'Examen KYC',es:'Revisión KYC',nl:'KYC-beoordeling',zh:'KYC审查',hi:'KYC समीक्षा'},
	profile_kyc_step_6_desc: {en:'Submitted documents are reviewed by the compliance engine. Review takes 1-3 business days. You will be notified.',ar:'تتم مراجعة الوثائق المقدمة بواسطة محرك الامتثال. يستغرق الاستعراض 1-3 أيام عمل. سيتم إخطارك.',fr:'Les documents soumis sont examinés par le moteur de conformité. L\'examen prend 1 à 3 jours ouvrables. Vous serez notifié.',es:'Los documentos presentados son revisados por el motor de cumplimiento. La revisión toma 1-3 días hábiles. Serás notificado.',nl:'Ingediende documenten worden beoordeeld door de nalevingsengine. Beoordeling duurt 1-3 werkdagen. U wordt op de hoogte gesteld.',zh:'已提交的文件由合规引擎审查。审查需要 1-3 个工作日。您将收到通知。',hi:'प्रस्तुत दस्तावेज़ों की अनुपालन इंजन द्वारा समीक्षा की जाती है। समीक्षा में 1-3 व्यावसायिक दिन लगते हैं। आपको सूचित किया जाएगा।'},
	profile_kyc_step_6_action: {en:'Awaiting Review',ar:'في انتظار المراجعة',fr:'En attente d\'examen',es:'Pendiente de revisión',nl:'In afwachting van beoordeling',zh:'等待审核',hi:'समीक्षा की प्रतीक्षा में'},

	profile_kyc_step_7_title: {en:'KYC Approved',ar:'KYC موافق عليه',fr:'KYC approuvé',es:'KYC aprobado',nl:'KYC goedgekeurd',zh:'KYC已批准',hi:'KYC मंजूरी'},
	profile_kyc_step_7_desc: {en:'Identity verified. Full economic features, token access, and sovereign credentials are now unlocked.',ar:'تم التحقق من الهوية. تم فتح جميع الميزات الاقتصادية والوصول إلى الرموز والبيانات الاعتماديةIFORM السيادية.',fr:'Identité vérifiée. Toutes les fonctionnalités économiques, l\'accès aux tokens et les credentials souverains sont maintenant déverrouillés.',es:'Identidad verificada. Se han desbloqueado todas las funciones económicas, el acceso a tokens y las credenciales soberanas.',nl:'Identiteit geverifieerd. Alle economische functies, tokentogang en soevereine geloofsbrieven zijn nu ontgrendeld.',zh:'身份已验证。所有经济功能、代币访问权限和主权证书现已解锁。',hi:'पहचान सत्यापित। सभी आर्थिक सुविधाएं, टोकन पहुंच और संप्रभु साक्षप्त्र अब अनलॉक हैं।'},
	profile_kyc_step_7_action: {en:'Sovereign Unlocked',ar:'السيادية مفتوحة',fr:'Souverain déverrouillé',es:'Soberano desbloqueado',nl:'Soeverein ontgrendeld',zh:'主权已解锁',hi:'संप्रभु अनलॉक'},

	/* ── KYC DOCUMENTS ── */
	profile_kyc_doc_1_title: {en:'Passport',ar:'جواز السفر',fr:'Passeport',es:'Pasaporte',nl:'Paspoort',zh:'护照',hi:'पासपोर्ट'},
	profile_kyc_doc_1_desc: {en:'International passport, all pages. File must be under 5MB. PDF or JPEG.',ar:'جواز سفر دولي، جميع الصفحات. يجب أن يكون الملف أقل من 5 ميجابايت. PDF أو JPEG.',fr:'Passeport international, toutes les pages. Le fichier doit être inférieur à 5 Mo. PDF ou JPEG.',es:'Pasaporte internacional, todas las páginas. El archivo debe ser menor de 5 MB. PDF o JPEG.',nl:'Internationaal paspoort, alle pagina\'s. Bestand moet minder dan 5 MB zijn. PDF of JPEG.',zh:'国际护照，所有页面。文件必须小于 5MB。PDF 或 JPEG。',hi:'अंतर्राष्ट्रीय पासपोर्ट, सभी पृष्ठ। फ़ाइल 5MB से कम होनी चाहिए। PDF या JPEG।'},

	profile_kyc_doc_2_title: {en:'National ID',ar:'بطاقة الهوية الوطنية',fr:'Carte d\'identité nationale',es:'Carné de identidad nacional',nl:'Nationale identiteitskaart',zh:'国民身份证',hi:'राष्ट्रीय आईडी'},
	profile_kyc_doc_2_desc: {en:'Front and back of national identity card. Clear, unobstructed photo.',ar:'الجانب الأمامي والخلفي لبطاقة الهوية الوطنية. صورة واضحة وخالية من العوائق.',fr:'Recto et verso de la carte d\'identité nationale. Photo claire et sans obstruction.',es:'Anverso y reverso de la tarjeta de identificación nacional. Foto clara e sin obstrucciones.',nl:'Voor- en achterkant van het nationale identiteitsdocument. Duidelijke, onbelemmerde foto.',zh:'国民身份证的正面和背面。清晰、无遮挡的照片。',hi:'राष्ट्रीय पहचान पत्र के आगे और पीछे। स्पष्ट, निर्बाध फोटो।'},

	profile_kyc_doc_3_title: {en:'Proof of Address',ar:'إثبات العنوان',fr:'Preuve de résidence',es:'Comprobante de domicilio',nl:'Woonplaatsbewijs',zh:'地址证明',hi:'पता प्रमाण'},
	profile_kyc_doc_3_desc: {en:'Utility bill or bank statement. Dated within 90 days. Shows full legal address.',ar:'فاتورة مرافق أو كشف حساب بنكي. بتاريخ في غضون 90 يومًا. يعرض العنوان القانوني الكامل.',fr:'Facture de service public ou relevé bancaire. Daté dans les 90 jours. Affiche l\'adresse légale complète.',es:'Recibo de servicios públicos o extracto bancario. Fechado dentro de 90 días. Muestra la dirección legal completa.',nl:'Nutsrekening of bankafschrift. Gedateerd binnen 90 dagen. Toont het volledige juridische adres.',zh:'公用事业账单或银行对账单。90天内开具。显示完整的法律地址。',hi:'उपयोगिता बिल या बैंक विवरण। 90 दिनों के भीतर दिनांकित। पूर्ण कानूनी पता दिखाता है।'},

	profile_kyc_doc_4_title: {en:'Liveness Selfie',ar:'صورة ذاتية حية',fr:'Selfie de vivacité',es:'Selfie de vivacidad',nl:'Levendigheid Selfie',zh:'活跃自拍',hi:'जीवंत सेल्फी'},
	profile_kyc_doc_4_desc: {en:'Short video selfie holding your document. Taken in good lighting. 60 seconds.',ar:'فيديو سيلفي قصير تمسك به بوثيقتك. يتم التقاطه في إضاءة جيدة. 60 ثانية.',fr:'Courte vidéo selfie tenant votre document. Prise dans une bonne lumière. 60 secondes.',es:'Breve vídeo selfie sosteniendo tu documento. Tomado con buena iluminación. 60 segundos.',nl:'Korte selfievideo met uw document in de hand. Opgenomen in goed licht. 60 seconden.',zh:'短视频自拍，手持您的文件。在良好照明下进行。60 秒。',hi:'आपके दस्तावेज़ को पकड़ते हुए छोटा वीडियो सेल्फी। अच्छी रोशनी में लिया गया। 60 सेकंड।'},

	/* ── SECURITY TIERS ── */
	profile_sec_tier_0_name: {en:'Guest Access',ar:'وصول الضيف',fr:'Accès invité',es:'Acceso de invitado',nl:'Gasttoegang',zh:'访客访问权限',hi:'अतिथि पहुँच'},
	profile_sec_tier_0_desc: {en:'Browsing and exploration only. No economic features.',ar:'التصفح والاستكشاف فقط. بدون ميزات اقتصادية.',fr:'Navigation et exploration uniquement. Aucune fonctionnalité économique.',es:'Solo navegación y exploración. Sin características económicas.',nl:'Alleen bladeren en verkennen. Geen economische functies.',zh:'仅浏览和探索。没有经济功能。',hi:'केवल ब्राउजिंग और अन्वेषण। कोई आर्थिक विशेषताएं नहीं।'},

	profile_sec_tier_1_name: {en:'Email Verified',ar:'البريد الإلكتروني التحقق',fr:'Email vérifié',es:'Correo electrónico verificado',nl:'E-mail geverifieerd',zh:'电子邮件已验证',hi:'ईमेल सत्यापित'},
	profile_sec_tier_1_desc: {en:'Profile complete. Can subscribe to membership tiers.',ar:'الملف الشخصي كامل. يمكن الاشتراك في مستويات العضوية.',fr:'Profil complet. Peut s\'abonner aux niveaux d\'adhésion.',es:'Perfil completo. Puede suscribirse a niveles de membresía.',nl:'Profiel voltooid. Kan zich abonneren op lidmaatschapsniveaus.',zh:'个人资料完整。可以订阅成员级别。',hi:'प्रोफाइल पूर्ण। सदस्यता स्तरों की सदस्यता ले सकते हैं।'},

	profile_sec_tier_2_name: {en:'KYC Pending',ar:'KYC قيد الانتظار',fr:'KYC en attente',es:'KYC pendiente',nl:'KYC in behandeling',zh:'KYC待处理',hi:'KYC लंबित'},
	profile_sec_tier_2_desc: {en:'Documents submitted. Awaiting review. Some features unlocked.',ar:'تم تقديم الوثائق. في انتظار المراجعة. تم فتح بعض الميزات.',fr:'Documents soumis. En attente d\'examen. Certaines fonctionnalités déverrouillées.',es:'Documentos presentados. Pendiente de revisión. Algunas características desbloqueadas.',nl:'Documenten ingediend. Wachtend op beoordeling. Enkele functies ontgrendeld.',zh:'已提交文件。等待审核。某些功能已解锁。',hi:'दस्तावेज़ जमा किए गए। समीक्षा की प्रतीक्षा में। कुछ सुविधाएं अनलॉक की गई हैं।'},

	profile_sec_tier_3_name: {en:'KYC Verified',ar:'تحقق من KYC',fr:'KYC vérifié',es:'KYC verificado',nl:'KYC geverifieerd',zh:'KYC已验证',hi:'KYC सत्यापित'},
	profile_sec_tier_3_desc: {en:'Full identity verified. Economy, tokens, marketplace fully active.',ar:'تم التحقق الكامل من الهوية. الاقتصاد والرموز والسوق نشطة بالكامل.',fr:'Identité complètement vérifiée. Économie, tokens, marché entièrement actifs.',es:'Identidad completamente verificada. Economía, tokens, mercado completamente activos.',nl:'Identiteit volledig geverifieerd. Economie, tokens, marktplaats volledig actief.',zh:'身份完全验证。经济、代币、市场完全活跃。',hi:'पहचान पूरी तरह सत्यापित। अर्थव्यवस्था, टोकन, बाजार पूरी तरह सक्रिय।'},

	profile_sec_tier_4_name: {en:'Sovereign Verified',ar:'سيادية التحقق',fr:'Souverain vérifié',es:'Soberano verificado',nl:'Soeverein geverifieerd',zh:'主权已验证',hi:'संप्रभु सत्यापित'},
	profile_sec_tier_4_desc: {en:'HSM biometric linked. Full succession and inheritance rights.',ar:'HSM بيومتري مرتبط. حقوق الخلافة والوراثة الكاملة.',fr:'HSM biométrique lié. Droits de succession et d\'héritage complets.',es:'HSM biométrico vinculado. Derechos de sucesión y herencia completos.',nl:'HSM biometrisch gekoppeld. Volledige rechten op erfopvolging en erfrecht.',zh:'HSM 生物识别已连接。完全的继承权和遗产权。',hi:'HSM बायोमेट्रिक जुड़ा हुआ। संपूर्ण उत्तराधिकार और विरासत अधिकार।'},

	/* ── FEATURE UNLOCKS ── */
	profile_unlock_1_title: {en:'Token Economy',ar:'اقتصاد الرموز',fr:'Économie des tokens',es:'Economía de tokens',nl:'Token-economie',zh:'代币经济',hi:'टोकन अर्थव्यवस्था'},
	profile_unlock_1_desc: {en:'12 sovereign tokens fully active. Earning and spending enabled.',ar:'12 رمزًا سيادياً نشطًا بالكامل. تم تفعيل الكسب والإنفاق.',fr:'12 jetons souverains pleinement actifs. Gain et dépenses activés.',es:'12 tokens soberanos totalmente activos. Ganancias y gastos habilitados.',nl:'12 soevereine tokens volledig actief. Inkomsten en uitgaven ingeschakeld.',zh:'12 个完全激活的主权代币。启用收入和支出。',hi:'12 पूर्ण रूप से सक्रिय संप्रभु टोकन। आय और व्यय सक्षम।'},

	profile_unlock_2_title: {en:'Marketplace',ar:'السوق',fr:'Marché',es:'Mercado',nl:'Marktplaats',zh:'市场',hi:'बाजार'},
	profile_unlock_2_desc: {en:'Full listing, buying, and selling on the sovereign marketplace.',ar:'القائمة الكاملة والشراء والبيع في السوق السيادية.',fr:'Annonce complète, achat et vente sur le marché souverain.',es:'Listado completo, compra y venta en el mercado soberano.',nl:'Volledige vermelding, kopen en verkopen op de soevereine markt.',zh:'主权市场上的完整列表、购买和销售。',hi:'संप्रभु बाजार पर पूर्ण सूचीकरण, खरीद और बिक्री।'},

	profile_unlock_3_title: {en:'Subscription Payments',ar:'دفع الاشتراك',fr:'Paiements par abonnement',es:'Pagos de suscripción',nl:'Abonnementsbetalingen',zh:'订阅支付',hi:'सदस्यता भुगतान'},
	profile_unlock_3_desc: {en:'Live Stripe payment processing for all membership tiers.',ar:'معالجة دفع Stripe المباشرة لجميع مستويات العضوية.',fr:'Traitement des paiements Stripe en direct pour tous les niveaux d\'adhésion.',es:'Procesamiento de pagos de Stripe en vivo para todos los niveles de membresía.',nl:'Live Stripe-betalingsverwerking voor alle lidmaatschapsniveaus.',zh:'所有成员级别的实时 Stripe 支付处理。',hi:'सभी सदस्यता स्तरों के लिए लाइव Stripe भुगतान प्रसंस्करण।'},

	profile_unlock_4_title: {en:'Consultancy Booking',ar:'حجز الاستشارات',fr:'Réservation de conseil',es:'Reserva de consultoría',nl:'Boeking van advies',zh:'咨询预订',hi:'परामर्श बुकिंग'},
	profile_unlock_4_desc: {en:'Paid consultancy sessions across all 6 expert domains.',ar:'جلسات استشارات مدفوعة عبر جميع المجالات الستة للخبراء.',fr:'Séances de conseil payantes dans les 6 domaines d\'expertise.',es:'Sesiones de consultoría pagadas en los 6 dominios de expertos.',nl:'Betaalde adviessessies in alle 6 expertisegebieden.',zh:'六个专家领域中的付费咨询课程。',hi:'सभी 6 विशेषज्ञ डोमेन में भुगतान किए गए परामर्श सत्र।'},

	profile_unlock_5_title: {en:'Inheritance Rights',ar:'حقوق الوراثة',fr:'Droits d\'héritage',es:'Derechos de herencia',nl:'Erfrechten',zh:'继承权',hi:'विरासत अधिकार'},
	profile_unlock_5_desc: {en:'Full legal succession protocol. Bloodline vault inheritance active.',ar:'بروتوكول الخلافة القانونية الكاملة. وراثة خزان الدم نشطة.',fr:'Protocole de succession légale complet. Héritage du coffre de la lignée actif.',es:'Protocolo de sucesión legal completo. Herencia del cofre de linaje activa.',nl:'Volledig wettelijk opvolgingsprotocol. Erfenis van bloedlijnkluis actief.',zh:'完整的法律继承议定书。血统保险库继承活跃。',hi:'पूर्ण कानूनी उत्तराधिकार प्रोटोकॉल। रक्त वंश तिजोरी वारिस सक्रिय।'},

	profile_unlock_6_title: {en:'Sovereign Credentials',ar:'بيانات اعتماد سيادية',fr:'Identifiants souverains',es:'Credenciales soberanas',nl:'Soevereine inloggegevens',zh:'主权凭证',hi:'संप्रभु साक्षप्त्र'},
	profile_unlock_6_desc: {en:'Cryptographic certificate issuance. Verifiable on-chain.',ar:'إصدار الشهادات التشفيرية. قابل للتحقق على السلسلة.',fr:'Émission de certificat cryptographique. Vérifiable sur chaîne.',es:'Emisión de certificado criptográfico. Verificable en cadena.',nl:'Emissie van cryptografisch certificaat. Verifieerbaar op het net.',zh:'加密证书发行。可在链上验证。',hi:'क्रिप्टोग्राफिक प्रमाण पत्र जारी करना। श्रृंखला पर सत्यापन योग्य।'},

	/* ── KYC STATUS STATES ── */
	profile_kyc_status_not_started_title: {en:'Verification Not Started',ar:'لم يتم بدء التحقق',fr:'Vérification non commencée',es:'Verificación no iniciada',nl:'Verificatie niet gestart',zh:'验证未启动',hi:'सत्यापन शुरू नहीं हुआ'},
	profile_kyc_status_not_started_badge: {en:'Not Started',ar:'لم تبدأ',fr:'Non commencé',es:'No iniciado',nl:'Niet gestart',zh:'未开始',hi:'शुरू नहीं किया'},
	profile_kyc_status_not_started_desc: {en:'Complete the steps below to begin your KYC journey.',ar:'أكمل الخطوات أدناه لبدء رحلة KYC الخاصة بك.',fr:'Complétez les étapes ci-dessous pour commencer votre parcours KYC.',es:'Completa los pasos a continuación para comenzar tu viaje KYC.',nl:'Voltooi de onderstaande stappen om uw KYC-traject te beginnen.',zh:'完成以下步骤开始您的 KYC 之旅。',hi:'अपनी KYC यात्रा शुरू करने के लिए नीचे दिए गए चरणों को पूरा करें।'},

	profile_kyc_status_submitted_title: {en:'Documents Submitted',ar:'تم تقديم الوثائق',fr:'Documents soumis',es:'Documentos presentados',nl:'Documenten ingediend',zh:'已提交文件',hi:'दस्तावेज़ जमा किए गए'},
	profile_kyc_status_submitted_badge: {en:'Under Review',ar:'تحت المراجعة',fr:'En cours d\'examen',es:'Bajo revisión',nl:'In beoordeling',zh:'审查中',hi:'समीक्षा के अधीन'},
	profile_kyc_status_submitted_desc: {en:'Your documents have been submitted and are under compliance review. This takes 1-3 business days.',ar:'تم تقديم وثائقك وتخضع لمراجعة الامتثال. هذا يستغرق 1-3 أيام عمل.',fr:'Vos documents ont été soumis et sont en cours d\'examen de conformité. Cela prend 1-3 jours ouvrables.',es:'Tus documentos han sido presentados y están bajo revisión de cumplimiento. Esto toma 1-3 días hábiles.',nl:'Uw documenten zijn ingediend en worden onderzocht op naleving. Dit duurt 1-3 werkdagen.',zh:'您的文件已提交，正在接受合规审查。这需要 1-3 个工作日。',hi:'आपके दस्तावेज़ जमा किए गए हैं और अनुपालन समीक्षा के अधीन हैं। इसमें 1-3 व्यावसायिक दिन लगते हैं।'},

	profile_kyc_status_verified_title: {en:'Identity Verified',ar:'تم التحقق من الهوية',fr:'Identité vérifiée',es:'Identidad verificada',nl:'Identiteit geverifieerd',zh:'身份已验证',hi:'पहचान सत्यापित'},
	profile_kyc_status_verified_badge: {en:'Fully Verified',ar:'التحقق الكامل',fr:'Complètement vérifiée',es:'Completamente verificado',nl:'Volledig geverifieerd',zh:'完全验证',hi:'पूरी तरह सत्यापित'},
	profile_kyc_status_verified_desc: {en:'Your sovereign identity is confirmed. All economic features, token access, and credentials are active.',ar:'تم تأكيد هويتك السيادية. جميع الميزات الاقتصادية والوصول إلى الرموز والبيانات الاعتماديةية نشطة.',fr:'Votre identité souveraine est confirmée. Toutes les fonctionnalités économiques, l\'accès aux tokens et les identifiants sont actifs.',es:'Tu identidad soberana está confirmada. Todas las características económicas, el acceso a tokens y las credenciales están activos.',nl:'Uw soevereine identiteit is bevestigd. Alle economische functies, tokentogang en inloggegevens zijn actief.',zh:'您的主权身份已确认。所有经济功能、代币访问权限和凭证都处于活跃状态。',hi:'आपकी संप्रभु पहचान की पुष्टि की गई है। सभी आर्थिक सुविधाएं, टोकन पहुंच और साक्षप्त्र सक्रिय हैं।'},

	profile_kyc_status_rejected_title: {en:'Verification Rejected',ar:'تم رفض التحقق',fr:'Vérification rejetée',es:'Verificación rechazada',nl:'Verificatie afgewezen',zh:'验证被拒绝',hi:'सत्यापन अस्वीकृत'},
	profile_kyc_status_rejected_badge: {en:'Rejected',ar:'مرفوض',fr:'Rejetée',es:'Rechazado',nl:'Afgewezen',zh:'被拒绝',hi:'अस्वीकृत'},
	profile_kyc_status_rejected_desc: {en:'Your documents could not be verified. Please resubmit with clear, valid documents.',ar:'لم يتمكن من التحقق من وثائقك. يرجى إعادة التقديم بوثائق واضحة وصالحة.',fr:'Vos documents n\'ont pas pu être vérifiés. Veuillez resoumettez avec des documents clairs et valides.',es:'No se pudieron verificar tus documentos. Por favor, reenvía documentos claros y válidos.',nl:'Uw documenten konden niet worden geverifieerd. Voer opnieuw in met duidelijke, geldige documenten.',zh:'您的文件无法验证。请使用清晰有效的文件重新提交。',hi:'आपके दस्तावेज़ों को सत्यापित नहीं किया जा सका। कृपया स्पष्ट, वैध दस्तावेज़ों के साथ फिर से जमा करें।'},

	/* ── ACCESS & MEMBERSHIP ── */
access_status:        {en:'Access Status',ar:'حالة الوصول',fr:'Statut d\'accès',es:'Estado de acceso',nl:'Toegangsstatus',zh:'访问状态',hi:'पहुँच स्थिति'},
trial_active:         {en:'Trial Active',ar:'تجربة نشطة',fr:'Essai actif',es:'Prueba activa',nl:'Proef actief',zh:'试用中',hi:'परीक्षण सक्रिय'},
permanent_access:     {en:'Permanent Access',ar:'وصول دائم',fr:'Accès permanent',es:'Acceso permanente',nl:'Permanente toegang',zh:'永久访问',hi:'स्थायी पहुँच'},
pending:              {en:'Pending',ar:'قيد الانتظار',fr:'En attente',es:'Pendiente',nl:'In afwachting',zh:'待定',hi:'लंबित'},
membership:           {en:'Membership',ar:'العضوية',fr:'Adhésion',es:'Membresía',nl:'Lidmaatschap',zh:'会员资格',hi:'सदस्यता'},
subscribe:            {en:'Subscribe',ar:'اشترك',fr:'S\'abonner',es:'Suscribirse',nl:'Abonneren',zh:'订阅',hi:'सदस्यता लें'},
tier:                 {en:'Tier',ar:'المستوى',fr:'Niveau',es:'Nivel',nl:'Laag',zh:'等级',hi:'स्तर'},

/* ── ACHIEVEMENTS ── */
achievements:         {en:'Achievements',ar:'الإنجازات',fr:'Réalisations',es:'Logros',nl:'Prestaties',zh:'成就',hi:'उपलब्धियाँ'},
trophies:             {en:'Trophies',ar:'الكؤوس',fr:'Trophées',es:'Trofeos',nl:'Trofeeën',zh:'奖杯',hi:'ट्रॉफी'},
medals:               {en:'Medals',ar:'الميداليات',fr:'Médailles',es:'Medallas',nl:'Medailles',zh:'奖章',hi:'पदक'},
certificates:         {en:'Certificates',ar:'الشهادات',fr:'Certificats',es:'Certificados',nl:'Certificaten',zh:'证书',hi:'प्रमाण पत्र'},

/* ── ELEMENTS ── */
fire:                 {en:'Fire',ar:'النار',fr:'Feu',es:'Fuego',nl:'Vuur',zh:'火',hi:'अग्नि'},
water:                {en:'Water',ar:'الماء',fr:'Eau',es:'Agua',nl:'Water',zh:'水',hi:'जल'},
wind:                 {en:'Wind',ar:'الريح',fr:'Vent',es:'Viento',nl:'Wind',zh:'风',hi:'वायु'},
metal:                {en:'Metal',ar:'المعدن',fr:'Métal',es:'Metal',nl:'Metaal',zh:'金属',hi:'धातु'},
sand:                 {en:'Sand',ar:'الرمل',fr:'Sable',es:'Arena',nl:'Zand',zh:'沙',hi:'रेत'},
soul:                 {en:'Soul',ar:'الروح',fr:'Âme',es:'Alma',nl:'Ziel',zh:'灵魂',hi:'आत्मा'},
space:                {en:'Space',ar:'الفضاء',fr:'Espace',es:'Espacio',nl:'Ruimte',zh:'空间',hi:'अंतरिक्ष'},
the_void:             {en:'Void',ar:'الفراغ',fr:'Vide',es:'Vacío',nl:'Leegte',zh:'虚空',hi:'रिक्त'},
the_ninth:            {en:'The Ninth',ar:'التاسع',fr:'Le Neuvième',es:'El Noveno',nl:'Het Negende',zh:'第九',hi:'नवम'},

/* ── SOCIAL ── */
social_title:         {en:'Social Platforms',ar:'المنصات الاجتماعية',fr:'Plateformes sociales',es:'Plataformas sociales',nl:'Sociale platformen',zh:'社交平台',hi:'सोशल प्लेटफॉर्म'},
follow_us:            {en:'Follow the Order',ar:'تابع النظام',fr:'Suivez l\'Ordre',es:'Sigue la Orden',nl:'Volg de Orde',zh:'关注秩序',hi:'आदेश का अनुसरण करें'},

/* ── ADVERTISING ── */
adv_title:            {en:'Advertising',ar:'الإعلانات',fr:'Publicité',es:'Publicidad',nl:'Advertenties',zh:'广告',hi:'विज्ञापन'},
adv_hide:             {en:'Hide Advertisements',ar:'إخفاء الإعلانات',fr:'Masquer les publicités',es:'Ocultar anuncios',nl:'Advertenties verbergen',zh:'隐藏广告',hi:'विज्ञापन छुपाएँ'},
adv_show:             {en:'Show Advertisements',ar:'إظهار الإعلانات',fr:'Afficher les publicités',es:'Mostrar anuncios',nl:'Advertenties tonen',zh:'显示广告',hi:'विज्ञापन दिखाएँ'},

/* ── ACTION BUTTONS ── */
save:                 {en:'Save',ar:'حفظ',fr:'Sauvegarder',es:'Guardar',nl:'Opslaan',zh:'保存',hi:'सहेजें'},
cancel:               {en:'Cancel',ar:'إلغاء',fr:'Annuler',es:'Cancelar',nl:'Annuleren',zh:'取消',hi:'रद्द करें'},
delete:               {en:'Delete',ar:'حذف',fr:'Supprimer',es:'Eliminar',nl:'Verwijderen',zh:'删除',hi:'हटाएं'},
edit:                 {en:'Edit',ar:'تعديل',fr:'Éditer',es:'Editar',nl:'Bewerken',zh:'编辑',hi:'संपादित करें'},
approve:              {en:'Approve',ar:'الموافقة',fr:'Approuver',es:'Aprobar',nl:'Goedkeuren',zh:'批准',hi:'मंजूरी दें'},
reject:               {en:'Reject',ar:'رفض',fr:'Refuser',es:'Rechazar',nl:'Afwijzen',zh:'拒绝',hi:'अस्वीकार करें'},
export:               {en:'Export',ar:'تصدير',fr:'Exporter',es:'Exportar',nl:'Exporteren',zh:'导出',hi:'निर्यात करें'},
import:               {en:'Import',ar:'استيراد',fr:'Importer',es:'Importar',nl:'Importeren',zh:'导入',hi:'आयात करें'},
download:             {en:'Download',ar:'تنزيل',fr:'Télécharger',es:'Descargar',nl:'Downloaden',zh:'下载',hi:'डाउनलोड करें'},
upload:               {en:'Upload',ar:'تحميل',fr:'Télécharger',es:'Cargar',nl:'Uploaden',zh:'上传',hi:'अपलोड करें'},
share:                {en:'Share',ar:'مشاركة',fr:'Partager',es:'Compartir',nl:'Delen',zh:'分享',hi:'साझा करें'},
submit:               {en:'Submit',ar:'إرسال',fr:'Soumettre',es:'Enviar',nl:'Indienen',zh:'提交',hi:'जमा करें'},
confirm:              {en:'Confirm',ar:'تأكيد',fr:'Confirmer',es:'Confirmar',nl:'Bevestigen',zh:'确认',hi:'पुष्टि करें'},

/* ── FORM LABELS ── */
name:                 {en:'Name',ar:'الاسم',fr:'Nom',es:'Nombre',nl:'Naam',zh:'名称',hi:'नाम'},
display_name:         {en:'Display Name',ar:'اسم العرض',fr:'Nom d\'affichage',es:'Nombre visible',nl:'Weergavenaam',zh:'显示名称',hi:'प्रदर्शन नाम'},
description:          {en:'Description',ar:'الوصف',fr:'Description',es:'Descripción',nl:'Beschrijving',zh:'描述',hi:'विवरण'},
title:                {en:'Title',ar:'العنوان',fr:'Titre',es:'Título',nl:'Titel',zh:'标题',hi:'शीर्षक'},
content:              {en:'Content',ar:'المحتوى',fr:'Contenu',es:'Contenido',nl:'Inhoud',zh:'内容',hi:'सामग्री'},
date:                 {en:'Date',ar:'التاريخ',fr:'Date',es:'Fecha',nl:'Datum',zh:'日期',hi:'तारीख'},
time:                 {en:'Time',ar:'الوقت',fr:'Heure',es:'Hora',nl:'Tijd',zh:'时间',hi:'समय'},
status:               {en:'Status',ar:'الحالة',fr:'Statut',es:'Estado',nl:'Status',zh:'状态',hi:'स्थिति'},
category:             {en:'Category',ar:'الفئة',fr:'Catégorie',es:'Categoría',nl:'Categorie',zh:'类别',hi:'श्रेणी'},
priority:             {en:'Priority',ar:'الأولوية',fr:'Priorité',es:'Prioridad',nl:'Prioriteit',zh:'优先级',hi:'प्राथमिकता'},

/* ── MESSAGE STATES ── */
loading:              {en:'Loading',ar:'جاري التحميل',fr:'Chargement',es:'Cargando',nl:'Laden',zh:'加载中',hi:'लोड हो रहा है'},
refresh:              {en:'Refresh',ar:'تحديث',fr:'Actualiser',es:'Actualizar',nl:'Vernieuwen',zh:'刷新',hi:'ताज़ा करें'},
search:               {en:'Search',ar:'بحث',fr:'Rechercher',es:'Buscar',nl:'Zoeken',zh:'搜索',hi:'खोज'},
private:              {en:'Private',ar:'خاص',fr:'Privé',es:'Privado',nl:'Privé',zh:'私密',hi:'निजी'},
public:               {en:'Public',ar:'عام',fr:'Public',es:'Público',nl:'Openbaar',zh:'公开',hi:'सार्वजनिक'},
close:                {en:'Close',ar:'إغلاق',fr:'Fermer',es:'Cerrar',nl:'Sluiten',zh:'关闭',hi:'बंद करें'},
more:                 {en:'Learn More',ar:'اعرف المزيد',fr:'En savoir plus',es:'Saber más',nl:'Meer info',zh:'了解更多',hi:'और जानें'},

/* ── EMPTY STATES ── */
empty_no_data:        {en:'No data available',ar:'لا توجد بيانات',fr:'Aucune donnée',es:'Sin datos',nl:'Geen gegevens',zh:'没有数据',hi:'कोई डेटा नहीं'},
empty_no_results:     {en:'No results found',ar:'لم يتم العثور على نتائج',fr:'Aucun résultat',es:'Sin resultados',nl:'Geen resultaten',zh:'未找到结果',hi:'कोई परिणाम नहीं'},
empty_no_items:       {en:'No items',ar:'لا توجد عناصر',fr:'Aucun élément',es:'Sin elementos',nl:'Geen items',zh:'没有项目',hi:'कोई आइटम नहीं'},
empty_try_again:      {en:'Try again',ar:'حاول مرة أخرى',fr:'Réessayer',es:'Intentar de nuevo',nl:'Probeer opnieuw',zh:'重试',hi:'फिर से कोशिश करें'},

/* ── SUCCESS MESSAGES ── */
success_saved:        {en:'Saved successfully',ar:'تم الحفظ بنجاح',fr:'Enregistré avec succès',es:'Guardado correctamente',nl:'Succesvol opgeslagen',zh:'保存成功',hi:'सफलतापूर्वक सहेजा गया'},
success_created:      {en:'Created successfully',ar:'تم الإنشاء بنجاح',fr:'Créé avec succès',es:'Creado correctamente',nl:'Succesvol gemaakt',zh:'创建成功',hi:'सफलतापूर्वक बनाया गया'},
success_deleted:      {en:'Deleted successfully',ar:'تم الحذف بنجاح',fr:'Supprimé avec succès',es:'Eliminado correctamente',nl:'Succesvol verwijderd',zh:'删除成功',hi:'सफलतापूर्वक हटाया गया'},
success_updated:      {en:'Updated successfully',ar:'تم التحديث بنجاح',fr:'Mis à jour avec succès',es:'Actualizado correctamente',nl:'Succesvol bijgewerkt',zh:'更新成功',hi:'सफलतापूर्वक अद्यतन किया गया'},

/* ── ERROR MESSAGES ── */
error_try_again:      {en:'Something went wrong, please try again',ar:'حدث خطأ ما، يرجى المحاولة مرة أخرى',fr:'Une erreur s\'est produite, veuillez réessayer',es:'Algo salió mal, intenta de nuevo',nl:'Er is iets misgegaan, probeer opnieuw',zh:'出错了,请重试',hi:'कुछ गलत हुआ, कृपया फिर से प्रयास करें'},
error_permission:     {en:'Permission denied',ar:'تم رفض الإذن',fr:'Accès refusé',es:'Permiso denegado',nl:'Toegang geweigerd',zh:'权限被拒绝',hi:'अनुमति अस्वीकृत'},
error_not_found:      {en:'Not found',ar:'لم يتم العثور عليه',fr:'Non trouvé',es:'No encontrado',nl:'Niet gevonden',zh:'未找到',hi:'नहीं मिला'},
error_network:        {en:'Network error',ar:'خطأ في الشبكة',fr:'Erreur réseau',es:'Error de red',nl:'Netwerkfout',zh:'网络错误',hi:'नेटवर्क त्रुटि'},

/* ── WARNING MESSAGES ── */
warn_unsaved:         {en:'You have unsaved changes',ar:'لديك تغييرات غير محفوظة',fr:'Vous avez des modifications non enregistrées',es:'Tienes cambios sin guardar',nl:'Je hebt niet-opgeslagen wijzigingen',zh:'你有未保存的更改',hi:'आपके पास असहेजे गए परिवर्तन हैं'},
warn_delete:          {en:'Are you sure?',ar:'هل أنت متأكد؟',fr:'Êtes-vous sûr?',es:'¿Estás seguro?',nl:'Weet je het zeker?',zh:'你确定吗?',hi:'क्या आप सुनिश्चित हैं?'},
warn_required:        {en:'This field is required',ar:'هذا الحقل مطلوب',fr:'Ce champ est obligatoire',es:'Este campo es obligatorio',nl:'Dit veld is verplicht',zh:'此字段为必填项',hi:'यह फील्ड आवश्यक है'},

/* ── ACHIEVEMENTS & TROPHIES ── */
achievement_genesis:   {en:'Genesis',ar:'البداية',fr:'Genèse',es:'Génesis',nl:'Schepping',zh:'创世',hi:'निर्माण'},
achievement_knowledge: {en:'Knowledge',ar:'المعرفة',fr:'Connaissance',es:'Conocimiento',nl:'Kennis',zh:'知识',hi:'ज्ञान'},
achievement_mastery:   {en:'Mastery',ar:'الإتقان',fr:'Maîtrise',es:'Dominio',nl:'Meesterschap',zh:'精通',hi:'महारत'},
achievement_contribution:{en:'Contribution',ar:'المساهمة',fr:'Contribution',es:'Contribución',nl:'Bijdrage',zh:'贡献',hi:'योगदान'},
achievement_elemental: {en:'Elemental',ar:'العنصري',fr:'Élémentaire',es:'Elemental',nl:'Elementair',zh:'元素',hi:'प्राथमिक'},
achievement_celestial: {en:'Celestial',ar:'السماوي',fr:'Céleste',es:'Celestial',nl:'Hemels',zh:'天体',hi:'दिव्य'},
achievement_sovereign: {en:'Sovereign',ar:'السيادي',fr:'Souverain',es:'Soberano',nl:'Soeverein',zh:'主权',hi:'संप्रभु'},
achievement_bloodline: {en:'Bloodline',ar:'النسب',fr:'Lignée',es:'Linaje',nl:'Afstamming',zh:'血统',hi:'वंशावली'},
achievement_economic:  {en:'Economic',ar:'الاقتصادي',fr:'Économique',es:'Económico',nl:'Economisch',zh:'经济',hi:'आर्थिक'},
achievement_oracle:    {en:'Oracle',ar:'الأوراكل',fr:'Oracle',es:'Oráculo',nl:'Orakel',zh:'神谕',hi:'भविष्यवक्ता'},
achievement_guardian:  {en:'Guardian',ar:'الحارس',fr:'Gardien',es:'Guardián',nl:'Beschermer',zh:'守护者',hi:'रक्षक'},
achievement_apex:      {en:'Apex',ar:'القمة',fr:'Apex',es:'Ápice',nl:'Top',zh:'顶点',hi:'शिखर'},

/* ── MEDALS ── */
medal_1st_light:       {en:'1st Light',ar:'النور الأول',fr:'Première Lumière',es:'Primer Destello',nl:'Eerste Licht',zh:'初光',hi:'प्रथम प्रकाश'},
medal_pioneer:         {en:'Pioneer',ar:'الرائد',fr:'Pionnier',es:'Pionero',nl:'Pionier',zh:'先驱',hi:'अग्रदूत'},
medal_craftmaster:     {en:'Craftmaster',ar:'سيد الحرفة',fr:'Maître Artisan',es:'Maestro Artesano',nl:'Meesterambachtsman',zh:'工艺大师',hi:'शिल्पकार प्रमुख'},
medal_builder:         {en:'Builder',ar:'البناء',fr:'Constructeur',es:'Constructor',nl:'Bouwer',zh:'建造者',hi:'निर्माता'},
medal_navigator:       {en:'Navigator',ar:'الملاح',fr:'Navigateur',es:'Navegante',nl:'Navigator',zh:'导航员',hi:'नेविगेटर'},
medal_architect:       {en:'Architect',ar:'المهندس',fr:'Architecte',es:'Arquitecto',nl:'Architect',zh:'建筑师',hi:'वास्तुकार'},
medal_consul:          {en:'Consul',ar:'القنصل',fr:'Consul',es:'Cónsul',nl:'Consul',zh:'领事',hi:'कांसूल'},
medal_researcher:      {en:'Researcher',ar:'الباحث',fr:'Chercheur',es:'Investigador',nl:'Onderzoeker',zh:'研究员',hi:'शोधकर्ता'},
medal_prophet:         {en:'Prophet',ar:'النبي',fr:'Prophète',es:'Profeta',nl:'Profeet',zh:'先知',hi:'पैगंबर'},
medal_keeper:          {en:'Keeper',ar:'الحامي',fr:'Gardien',es:'Guardián',nl:'Bewaarder',zh:'守护者',hi:'रक्षक'},

/* ── CERTIFICATES ── */
cert_genesis_cert:     {en:'Genesis Cert',ar:'شهادة البداية',fr:'Cert Genèse',es:'Cert Génesis',nl:'Cert Schepping',zh:'创世证书',hi:'निर्माण प्रमाणपत्र'},
cert_knowledge_i:      {en:'Knowledge I',ar:'المعرفة الأولى',fr:'Connaissance I',es:'Conocimiento I',nl:'Kennis I',zh:'知识 I',hi:'ज्ञान I'},
cert_mastery_i:        {en:'Mastery I',ar:'الإتقان الأول',fr:'Maîtrise I',es:'Dominio I',nl:'Meesterschap I',zh:'精通 I',hi:'महारत I'},
cert_mastery_ii:       {en:'Mastery II',ar:'الإتقان الثاني',fr:'Maîtrise II',es:'Dominio II',nl:'Meesterschap II',zh:'精通 II',hi:'महारत II'},
cert_economist:        {en:'Economist',ar:'الاقتصادي',fr:'Économiste',es:'Economista',nl:'Econoom',zh:'经济学家',hi:'अर्थशास्त्री'},
cert_celestial:        {en:'Celestial',ar:'السماوي',fr:'Céleste',es:'Celestial',nl:'Hemels',zh:'天体',hi:'दिव्य'},
cert_heritage:         {en:'Heritage',ar:'التراث',fr:'Héritage',es:'Herencia',nl:'Erfgoed',zh:'遗产',hi:'विरासत'},
cert_oracle:           {en:'Oracle',ar:'الأوراكل',fr:'Oracle',es:'Oráculo',nl:'Orakel',zh:'神谕',hi:'भविष्यवक्ता'},
cert_consultant:       {en:'Consultant',ar:'الاستشاري',fr:'Consultant',es:'Consultor',nl:'Consultant',zh:'顾问',hi:'सलाहकार'},
cert_platform_mst:     {en:'Platform Mst',ar:'إتقان المنصة',fr:'Maî Plateforme',es:'Plat Dominio',nl:'Plat Meester',zh:'平台精通',hi:'प्लेटफॉर्म महारत'},

/* ── PHASES ── */
phase_sand_genesis:    {en:'Sand Genesis',ar:'بدء الرمل',fr:'Genèse Sable',es:'Génesis Arena',nl:'Zand Schepping',zh:'沙砾创世',hi:'रेत निर्माण'},
phase_glass_awakening: {en:'Glass Awakening',ar:'إيقاظ الزجاج',fr:'Réveil Verre',es:'Despertar Vidrio',nl:'Glas Ontwaken',zh:'玻璃觉醒',hi:'ग्लास जागरण'},
phase_iron_forging:    {en:'Iron Forging',ar:'تطريق الحديد',fr:'Forge Fer',es:'Forja Hierro',nl:'Ijzer Smeden',zh:'铁锻',hi:'लोहा जाली'},
phase_steel_tempering: {en:'Steel Tempering',ar:'تلطيف الفولاذ',fr:'Trempe Acier',es:'Temple Acero',nl:'Staal Hardening',zh:'钢淬火',hi:'स्टील स्वभाव'},
phase_titanium_ascent: {en:'Titanium Ascent',ar:'صعود التيتانيوم',fr:'Ascension Titane',es:'Ascenso Titanio',nl:'Titanium Opklimming',zh:'钛上升',hi:'टाइटेनियम आरोहण'},
phase_carbon_precision:{en:'Carbon Precision',ar:'دقة الكربون',fr:'Précision Carbone',es:'Precisión Carbono',nl:'Koolstof Precisie',zh:'碳精确',hi:'कार्बन सटीकता'},
phase_gold_sovereignty:{en:'Gold Sovereignty',ar:'السيادة الذهبية',fr:'Souveraineté Or',es:'Soberanía Oro',nl:'Goud Soevereiniteit',zh:'黄金主权',hi:'सोना संप्रभुता'},
phase_platinum_legacy: {en:'Platinum Legacy',ar:'إرث البلاتين',fr:'Héritage Platine',es:'Legado Platino',nl:'Platina Erfenis',zh:'铂金遗产',hi:'प्लेटिनम विरासत'},
phase_diamond_approach:{en:'Diamond Approach',ar:'نهج الماس',fr:'Approche Diamant',es:'Enfoque Diamante',nl:'Diamant Benadering',zh:'钻石方法',hi:'हीरा दृष्टिकोण'},
phase_diamond_clarity: {en:'Diamond Clarity',ar:'وضوح الماس',fr:'Clarté Diamant',es:'Claridad Diamante',nl:'Diamant Helderheid',zh:'钻石清晰',hi:'हीरा स्पष्टता'},
phase_omega_threshold: {en:'Omega Threshold',ar:'عتبة أوميغا',fr:'Seuil Omega',es:'Umbral Omega',nl:'Omega Drempel',zh:'欧米茄阈值',hi:'ओमेगा दहलीज'},
phase_omega_master:    {en:'Omega Master',ar:'سيد أوميغا',fr:'Maître Omega',es:'Maestro Omega',nl:'Omega Meester',zh:'欧米茄大师',hi:'ओमेगा मास्टर'},

/* ── TOKENS ── */
token_pyron:           {en:'Pyron',ar:'بيرون',fr:'Pyron',es:'Piron',nl:'Pyron',zh:'烈火令',hi:'पाइरॉन'},
token_aurum:           {en:'Aurum',ar:'أوروم',fr:'Aurum',es:'Áureo',nl:'Aurum',zh:'黄金令',hi:'सोना'},
token_zephyr:          {en:'Zephyr',ar:'زفير',fr:'Zéphyr',es:'Céfiro',nl:'Zefir',zh:'清风令',hi:'जेफिर'},
token_nereid:          {en:'Nereid',ar:'نيريد',fr:'Néréide',es:'Nereida',nl:'Nereus',zh:'海妖令',hi:'नेरिड'},
token_solari:          {en:'Solari',ar:'سولاري',fr:'Solaris',es:'Solaris',nl:'Solari',zh:'太阳令',hi:'सोलरी'},
token_virgite:         {en:'Virgite',ar:'فيرجيت',fr:'Virgite',es:'Virgita',nl:'Virgiet',zh:'处女令',hi:'वर्जिट'},
token_forgeon:         {en:'Forgeon',ar:'فورجيون',fr:'Forgeon',es:'Forjeón',nl:'Forgeon',zh:'锻造令',hi:'फोर्जन'},
token_styx:            {en:'Styx',ar:'ستيكس',fr:'Styx',es:'Estigia',nl:'Styx',zh:'冥河令',hi:'स्टाइक्स'},
token_ember:           {en:'Ember',ar:'جمرة',fr:'Braise',es:'Brasa',nl:'Sintels',zh:'余烬令',hi:'अंगार'},
token_ferrum:          {en:'Ferrum',ar:'فيروم',fr:'Ferrum',es:'Hierro',nl:'Ferrum',zh:'铁令',hi:'लोहा'},
token_prime:           {en:'Prime',ar:'برايم',fr:'Prime',es:'Primero',nl:'Prime',zh:'至尊令',hi:'प्रमुख'},
token_abyss:           {en:'Abyss',ar:'الهاوية',fr:'Abîme',es:'Abismo',nl:'Afgrond',zh:'深渊令',hi:'गहराई'},

/* ── MATERIAL TIERS ── */
material_sand:         {en:'Sand',ar:'الرمل',fr:'Sable',es:'Arena',nl:'Zand',zh:'沙砾',hi:'रेत'},
material_glass:        {en:'Glass',ar:'الزجاج',fr:'Verre',es:'Vidrio',nl:'Glas',zh:'玻璃',hi:'कांच'},
material_iron:         {en:'Iron',ar:'الحديد',fr:'Fer',es:'Hierro',nl:'IJzer',zh:'铁',hi:'लोहा'},
material_steel:        {en:'Steel',ar:'الفولاذ',fr:'Acier',es:'Acero',nl:'Staal',zh:'钢',hi:'स्टील'},
material_titanium:     {en:'Titanium',ar:'التيتانيوم',fr:'Titane',es:'Titanio',nl:'Titanium',zh:'钛',hi:'टाइटेनियम'},
material_carbon:       {en:'Carbon',ar:'الكربون',fr:'Carbone',es:'Carbono',nl:'Koolstof',zh:'碳',hi:'कार्बन'},
material_gold:         {en:'Gold',ar:'الذهب',fr:'Or',es:'Oro',nl:'Goud',zh:'黄金',hi:'सोना'},
material_platinum:     {en:'Platinum',ar:'البلاتين',fr:'Platine',es:'Platino',nl:'Platina',zh:'铂金',hi:'प्लेटिनम'},
material_diamond:      {en:'Diamond',ar:'الماس',fr:'Diamant',es:'Diamante',nl:'Diamant',zh:'钻石',hi:'हीरा'},
material_adamant:      {en:'Adamant',ar:'الماس الصلب',fr:'Adamant',es:'Adamantina',nl:'Adamant',zh:'刚毅',hi:'अदामांट'},
material_prime:        {en:'Prime',ar:'برايم',fr:'Prime',es:'Primero',nl:'Prime',zh:'至尊',hi:'प्रमुख'},
material_omega_master: {en:'Omega Master',ar:'سيد أوميغا',fr:'Maître Omega',es:'Maestro Omega',nl:'Omega Meester',zh:'欧米茄大师',hi:'ओमेगा मास्टर'},

/* ── ELEMENTS ── */
element_fire:          {en:'Fire',ar:'النار',fr:'Feu',es:'Fuego',nl:'Vuur',zh:'火',hi:'आग'},
element_water:         {en:'Water',ar:'الماء',fr:'Eau',es:'Agua',nl:'Water',zh:'水',hi:'पानी'},
element_wind:          {en:'Wind',ar:'الريح',fr:'Vent',es:'Viento',nl:'Wind',zh:'风',hi:'हवा'},
element_sand:          {en:'Sand',ar:'الرمل',fr:'Sable',es:'Arena',nl:'Zand',zh:'沙',hi:'रेत'},
element_soul:          {en:'Soul',ar:'الروح',fr:'Âme',es:'Alma',nl:'Ziel',zh:'灵魂',hi:'आत्मा'},
element_metal:         {en:'Metal',ar:'المعدن',fr:'Métal',es:'Metal',nl:'Metaal',zh:'金属',hi:'धातु'},
element_space:         {en:'Space',ar:'الفضاء',fr:'Espace',es:'Espacio',nl:'Ruimte',zh:'空间',hi:'अंतरिक्ष'},
element_void:          {en:'Void',ar:'الفراغ',fr:'Vide',es:'Vacío',nl:'Leegte',zh:'虚空',hi:'रिक्त'},
element_theall:        {en:'The All',ar:'الكل',fr:'Le Tout',es:'El Todo',nl:'Het Alles',zh:'万物',hi:'सर्वज्ञ'},

/* ── PERSONAL OS SECTION ── */
personal_os_title:     {en:'PERSONAL OS · SOVEREIGN SELF-SYSTEM',ar:'نظام التشغيل الشخصي · نظام الذات السيادي',fr:'OS PERSONNEL · SYSTÈME SOUVERAIN',es:'SO PERSONAL · SISTEMA SOBERANO',nl:'PERSOONLIJKE OS · SOEVEREIN SYSTEEM',zh:'个人操作系统 · 主权自我系统',hi:'व्यक्तिगत ओएस · संप्रभु स्व-प्रणाली'},
kpi_journal_entries:   {en:'JOURNAL ENTRIES',ar:'إدخالات دفتر اليوميات',fr:'ENTRÉES DE JOURNAL',es:'ENTRADAS DEL DIARIO',nl:'DAGBOEKINGANGEN',zh:'日志条目',hi:'जर्नल प्रविष्टियां'},
kpi_gratitude_streak:  {en:'GRATITUDE STREAK',ar:'سلسلة الامتنان',fr:'SÉQUENCE DE GRATITUDE',es:'RACHA DE GRATITUD',nl:'DANKBAARHEIDSREEKS',zh:'感谢连胜',hi:'कृतज्ञता की लकीर'},
kpi_cards_due:         {en:'CARDS DUE TODAY',ar:'البطاقات المستحقة اليوم',fr:'CARTES DUES AUJOURD\'HUI',es:'TARJETAS VENCIDAS HOY',nl:'KAARTEN VERVALLEN VANDAAG',zh:'今天到期的卡片',hi:'आज देय कार्ड'},
kpi_vision_score:      {en:'VISION SCORE AVG',ar:'متوسط درجة الرؤية',fr:'MOYENNE DU SCORE DE VISION',es:'PROMEDIO DE PUNTUACIÓN DE VISIÓN',nl:'GEMIDDELDE VISIESCORES',zh:'视觉评分平均值',hi:'दृष्टि स्कोर औसत'},
kpi_savings_rate:      {en:'SAVINGS RATE',ar:'معدل الادخار',fr:'TAUX D\'ÉPARGNE',es:'TASA DE AHORRO',nl:'SPAARQUOTE',zh:'储蓄率',hi:'बचत दर'},
kpi_contacts_due:      {en:'CONTACTS DUE',ar:'جهات الاتصال المستحقة',fr:'CONTACTS À RAPPELER',es:'CONTACTOS VENCIDOS',nl:'CONTACTEN VERVALLEN',zh:'应跟进的联系人',hi:'संपर्क देय'},
kpi_open_decisions:    {en:'OPEN DECISIONS',ar:'القرارات المعلقة',fr:'DÉCISIONS OUVERTES',es:'DECISIONES ABIERTAS',nl:'OPEN BESLUITEN',zh:'未做的决定',hi:'खुले निर्णय'},
kpi_body_weight:       {en:'BODY WEIGHT',ar:'وزن الجسم',fr:'POIDS CORPOREL',es:'PESO CORPORAL',nl:'LICHAAMSGEWICHT',zh:'身体体重',hi:'शरीर का वजन'},
personal_life_wheel:   {en:'LIFE WHEEL · 8 DOMAINS',ar:'عجلة الحياة · 8 مجالات',fr:'ROUE DE VIE · 8 DOMAINES',es:'RUEDA DE VIDA · 8 DOMINIOS',nl:'LEVENSWIEEL · 8 DOMEINEN',zh:'人生之轮 · 8个领域',hi:'जीवन चक्र · 8 क्षेत्र'},
personal_quick_actions:{en:'TODAY\'S QUICK ACTIONS',ar:'إجراءات سريعة لهذا اليوم',fr:'ACTIONS RAPIDES DU JOUR',es:'ACCIONES RÁPIDAS DE HOY',nl:'SNELLE ACTIES VAN VANDAAG',zh:'今日快速操作',hi:'आज की त्वरित क्रियाएं'},
personal_activity_heatmap:{en:'SOVEREIGN ACTIVITY · 90-DAY HEATMAP',ar:'نشاط السيادة · خريطة حرارية 90 يومًا',fr:'ACTIVITÉ SOUVERAINE · CARTE THERMIQUE 90 JOURS',es:'ACTIVIDAD SOBERANA · MAPA DE CALOR 90 DÍAS',nl:'SOEVEREINE ACTIVITEIT · 90-DAAGSE HEATMAP',zh:'主权活动 · 90天热力图',hi:'संप्रभु गतिविधि · 90-दिन की हीटमैप'},
personal_tools_title:  {en:'PERSONAL SOVEREIGN TOOLS · ALL 8 MODULES',ar:'أدوات السيادة الشخصية · جميع 8 وحدات',fr:'OUTILS SOUVERAINS PERSONNELS · 8 MODULES',es:'HERRAMIENTAS SOBERANAS PERSONALES · 8 MÓDULOS',nl:'PERSOONLIJKE SOEVEREINE HULPMIDDELEN · 8 MODULES',zh:'个人主权工具 · 8个模块',hi:'व्यक्तिगत संप्रभु उपकरण · 8 मॉड्यूल'},
action_write_journal:  {en:'WRITE IN JOURNAL',ar:'اكتب في دفتر اليوميات',fr:'ÉCRIRE DANS LE JOURNAL',es:'ESCRIBIR EN DIARIO',nl:'SCHRIJF IN DAGBOEK',zh:'在日志中写入',hi:'जर्नल में लिखें'},
action_log_gratitude:  {en:'LOG GRATITUDE',ar:'تسجيل الامتنان',fr:'ENREGISTRER LA GRATITUDE',es:'REGISTRAR GRATITUD',nl:'DANKBAARHEID REGISTREREN',zh:'记录感谢',hi:'कृतज्ञता लॉग करें'},
action_study_flashcards:{en:'STUDY FLASHCARDS',ar:'دراسة بطاقات الفلاش',fr:'ÉTUDIER LES FICHES',es:'ESTUDIAR TARJETAS',nl:'FLASHCARDS BESTUDEREN',zh:'学习闪卡',hi:'फ्लैशकार्ड का अध्ययन करें'},
action_log_body:       {en:'LOG BODY STATS',ar:'تسجيل إحصائيات الجسم',fr:'ENREGISTRER STATISTIQUES CORPORELLES',es:'REGISTRAR ESTADÍSTICAS CORPORALES',nl:'LICHAAMSSTATISTIEKEN REGISTREREN',zh:'记录身体统计',hi:'शरीर के आंकड़े दर्ज करें'},
action_track_budget:   {en:'TRACK BUDGET',ar:'تتبع الميزانية',fr:'SUIVRE LE BUDGET',es:'RASTREAR PRESUPUESTO',nl:'BUDGET VOLGEN',zh:'跟踪预算',hi:'बजट ट्रैक करें'},
action_decision_journal:{en:'DECISION JOURNAL',ar:'دفتر القرارات',fr:'JOURNAL DES DÉCISIONS',es:'DIARIO DE DECISIONES',nl:'BESLISSINGSDAGBOEK',zh:'决策日志',hi:'निर्णय पत्रिका'},
tool_journal:          {en:'JOURNAL',ar:'دفتر اليوميات',fr:'JOURNAL',es:'DIARIO',nl:'DAGBOEK',zh:'日志',hi:'पत्रिका'},
tool_vision_board:     {en:'VISION BOARD',ar:'لوحة الرؤية',fr:'TABLEAU DE VISION',es:'TABLERO DE VISIÓN',nl:'VISIEBORD',zh:'愿景板',hi:'दृष्टि बोर्ड'},
tool_body_composition: {en:'BODY COMPOSITION',ar:'تكوين الجسم',fr:'COMPOSITION CORPORELLE',es:'COMPOSICIÓN CORPORAL',nl:'LICHAAMSSAMENSTELLING',zh:'身体成分',hi:'शरीर की संरचना'},
tool_gratitude:        {en:'GRATITUDE PRACTICE',ar:'ممارسة الامتنان',fr:'PRATIQUE DE GRATITUDE',es:'PRÁCTICA DE GRATITUD',nl:'DANKBAARHEIDSOEFENING',zh:'感谢练习',hi:'कृतज्ञता अभ्यास'},
tool_budget:           {en:'BUDGET PLANNER',ar:'مخطط الميزانية',fr:'PLANIFICATEUR DE BUDGET',es:'PLANIFICADOR DE PRESUPUESTO',nl:'BUDGETPLANNER',zh:'预算计划器',hi:'बजट योजनाकार'},
tool_network_intel:    {en:'NETWORK INTEL',ar:'استخبارات الشبكة',fr:'INTELLIGENCE RÉSEAU',es:'INTELIGENCIA DE RED',nl:'NETWERKINFORMATIE',zh:'网络情报',hi:'नेटवर्क इंटेल'},
tool_flashcards:       {en:'FLASHCARDS',ar:'بطاقات الفلاش',fr:'FICHES ÉCLAIR',es:'TARJETAS DE MEMORIA',nl:'FLASHCARDS',zh:'闪卡',hi:'फ्लैशकार्ड'},
tool_decision_journal: {en:'DECISION JOURNAL',ar:'دفتر القرارات',fr:'JOURNAL DES DÉCISIONS',es:'DIARIO DE DECISIONES',nl:'BESLISSINGSDAGBOEK',zh:'决策日志',hi:'निर्णय पत्रिका'},

/* ── PLATFORM SECTION ── */
platform_command_index: {en:'PLATFORM COMMAND INDEX · ALL 170 PAGES · 15 SECTIONS',ar:'فهرس أوامر المنصة · 170 صفحة · 15 قسم',fr:'INDEX DE COMMANDE PLATEFORME · 170 PAGES · 15 SECTIONS',es:'ÍNDICE DE COMANDO DE PLATAFORMA · 170 PÁGINAS · 15 SECCIONES',nl:'PLATFORMCOMMANDOINDEX · 170 PAGINA\'S · 15 SECTIES',zh:'平台命令索引 · 170页 · 15个部分',hi:'प्लेटफॉर्म कमांड इंडेक्स · 170 पृष्ठ · 15 अनुभाग'},
ecosystem_map:         {en:'ECOSYSTEM MAP',ar:'خريطة النظام البيئي',fr:'CARTE DE L\'ÉCOSYSTÈME',es:'MAPA DEL ECOSISTEMA',nl:'ECOSYSTEEMKAART',zh:'生态系统地图',hi:'पारिस्थितिकी तंत्र मानचित्र'},
intelligence_engine:   {en:'INTELLIGENCE ENGINE · ANALYTICS · RADAR · AI QUERY',ar:'محرك الذكاء · التحليلات · الرادار · استعلام الذكاء الاصطناعي',fr:'MOTEUR INTELLIGENCE · ANALYTIQUE · RADAR · REQUÊTE IA',es:'MOTOR DE INTELIGENCIA · ANÁLISIS · RADAR · CONSULTA IA',nl:'INTELLIGENTIEMOTOR · ANALYTISCHE GEGEVENS · RADAR · AI-QUERY',zh:'智能引擎 · 分析 · 雷达 · 人工智能查询',hi:'बुद्धिमत्ता इंजन · विश्लेषण · रडार · एआई क्वेरी'},
kpi_events_7d:        {en:'EVENTS (7d)',ar:'الأحداث (7 أيام)',fr:'ÉVÉNEMENTS (7j)',es:'EVENTOS (7d)',nl:'EVENEMENTEN (7d)',zh:'事件 (7天)',hi:'घटनाएं (7d)'},
kpi_sessions_7d:      {en:'SESSIONS (7d)',ar:'الجلسات (7 أيام)',fr:'SESSIONS (7j)',es:'SESIONES (7d)',nl:'SESSIES (7d)',zh:'会话 (7天)',hi:'सत्र (7d)'},
kpi_unique_members_7d: {en:'UNIQUE MEMBERS (7d)',ar:'أعضاء فريدة (7 أيام)',fr:'MEMBRES UNIQUES (7j)',es:'MIEMBROS ÚNICOS (7d)',nl:'UNIEKE LEDEN (7d)',zh:'独特成员 (7天)',hi:'अद्वितीय सदस्य (7d)'},
kpi_cta_clicks_7d:    {en:'CTA CLICKS (7d)',ar:'نقرات استدعاء الإجراء (7 أيام)',fr:'CLICS CTA (7j)',es:'CLICS CTA (7d)',nl:'CTA-KLIKKEN (7d)',zh:'CTA点击 (7天)',hi:'सीटीए क्लिक (7d)'},
kpi_ai_queries_7d:    {en:'AI QUERIES (7d)',ar:'استعلامات الذكاء الاصطناعي (7 أيام)',fr:'REQUÊTES IA (7j)',es:'CONSULTAS IA (7d)',nl:'AI-QUERY\'S (7d)',zh:'人工智能查询 (7天)',hi:'एआई प्रश्न (7d)'},
kpi_memories_stored:  {en:'MEMORIES STORED',ar:'الذكريات المخزنة',fr:'SOUVENIRS STOCKÉS',es:'MEMORIAS ALMACENADAS',nl:'OPGESLAGEN HERINNERINGEN',zh:'存储的记忆',hi:'संग्रहीत यादें'},
axis_progression_radar: {en:'AXIS PROGRESSION RADAR',ar:'رادار تقدم المحور',fr:'RADAR DE PROGRESSION DES AXES',es:'RADAR DE PROGRESIÓN DE EJES',nl:'ASSEN PROGRESSIERADAR',zh:'轴向进展雷达',hi:'अक्ष प्रगति रडार'},
full_analytics:       {en:'FULL ANALYTICS',ar:'تحليلات كاملة',fr:'ANALYSES COMPLÈTES',es:'ANÁLISIS COMPLETO',nl:'VOLLEDIGE ANALYTISCHE GEGEVENS',zh:'完整分析',hi:'पूर्ण विश्लेषण'},
sovereign_intelligence_direct_query: {en:'SOVEREIGN INTELLIGENCE · DIRECT QUERY',ar:'الذكاء السيادي · الاستعلام المباشر',fr:'INTELLIGENCE SOUVERAINE · REQUÊTE DIRECTE',es:'INTELIGENCIA SOBERANA · CONSULTA DIRECTA',nl:'SOEVEREINE INTELLIGENTIE · DIRECTE QUERY',zh:'主权智能 · 直接查询',hi:'संप्रभु बुद्धिमत्ता · सीधी क्वेरी'},
ai_intelligence_standby: {en:'Intelligence standby. Ask anything about platform status, member data, or sovereign operations.',ar:'استعداد الذكاء. اسأل عن أي شيء يتعلق بحالة المنصة أو بيانات الأعضاء أو العمليات السيادية.',fr:'Intelligence en attente. Posez n\'importe quelle question sur l\'état de la plateforme, les données des membres ou les opérations souveraines.',es:'Inteligencia en espera. Haz preguntas sobre el estado de la plataforma, los datos de los miembros u operaciones soberanas.',nl:'Intelligentie standby. Stel vragen over platformstatus, ledigengegevens of soevereine operaties.',zh:'智能待命。询问关于平台状态、成员数据或主权操作的任何信息。',hi:'बुद्धिमत्ता स्टैंडबाय। प्लेटफॉर्म स्थिति, सदस्य डेटा या संप्रभु संचालन के बारे में कुछ भी पूछें।'},
ai_query_placeholder: {en:'Ask the Intelligence Engine…',ar:'اسأل محرك الذكاء ...',fr:'Posez des questions au moteur d\'intelligence…',es:'Pregunta al Motor de Inteligencia…',nl:'Stel vragen aan de Intelligentiemotor…',zh:'询问智能引擎…',hi:'बुद्धिमत्ता इंजन से पूछें…'},
btn_ask:              {en:'ASK',ar:'اسأل',fr:'DEMANDER',es:'PREGUNTAR',nl:'VRAGEN',zh:'询问',hi:'पूछें'},
top_pages_session_distribution: {en:'TOP PAGES · SESSION DISTRIBUTION',ar:'أفضل الصفحات · توزيع الجلسات',fr:'MEILLEURES PAGES · DISTRIBUTION DES SESSIONS',es:'PÁGINAS PRINCIPALES · DISTRIBUCIÓN DE SESIONES',nl:'TOPPAGINA\'S · SESSIEDISTRIBUTIE',zh:'热门页面 · 会话分发',hi:'शीर्ष पृष्ठ · सत्र वितरण'},
sovereign_command_operations: {en:'SOVEREIGN COMMAND · OPERATIONS · AGENTS · ADMINISTRATION',ar:'قيادة سيادية · عمليات · وكلاء · إدارة',fr:'COMMANDE SOUVERAINE · OPÉRATIONS · AGENTS · ADMINISTRATION',es:'COMANDO SOBERANO · OPERACIONES · AGENTES · ADMINISTRACIÓN',nl:'SOEVEREIN COMMANDO · OPERATIES · AGENTEN · BEHEER',zh:'主权命令 · 操作 · 代理 · 管理',hi:'संप्रभु कमान · संचालन · एजेंट · प्रशासन'},
kpi_tasks_7d:         {en:'TASKS (7d)',ar:'المهام (7 أيام)',fr:'TÂCHES (7j)',es:'TAREAS (7d)',nl:'TAKEN (7d)',zh:'任务 (7天)',hi:'कार्य (7d)'},
kpi_workflows_live:   {en:'WORKFLOWS LIVE',ar:'مسارات العمل مباشرة',fr:'FLUX DE TRAVAIL EN DIRECT',es:'FLUJOS DE TRABAJO EN VIVO',nl:'WERKSTROMEN LIVE',zh:'实时工作流',hi:'वर्कफ़्लो लाइव'},
kpi_open_incidents:   {en:'OPEN INCIDENTS',ar:'الحوادث المفتوحة',fr:'INCIDENTS OUVERTS',es:'INCIDENTES ABIERTOS',nl:'OPEN INCIDENTEN',zh:'开放事件',hi:'खुली घटनाएं'},
kpi_agents_active:    {en:'AGENTS ACTIVE',ar:'الوكلاء نشطون',fr:'AGENTS ACTIFS',es:'AGENTES ACTIVOS',nl:'ACTIEVE AGENTEN',zh:'活跃代理',hi:'सक्रिय एजेंट'},
kpi_pending_access:   {en:'PENDING ACCESS',ar:'وصول معلق',fr:'ACCÈS EN ATTENTE',es:'ACCESO PENDIENTE',nl:'TOEGANG IN AFWACHTING',zh:'待处理的访问权限',hi:'लंबित पहुंच'},
kpi_enterprise_accounts: {en:'ENTERPRISE ACCOUNTS',ar:'حسابات المؤسسة',fr:'COMPTES ENTREPRISE',es:'CUENTAS EMPRESARIALES',nl:'BEDRIJFSACCOUNTS',zh:'企业帐户',hi:'एंटरप्राइज़ खाते'},
kpi_active_policies:  {en:'ACTIVE POLICIES',ar:'السياسات النشطة',fr:'POLITIQUES ACTIVES',es:'POLÍTICAS ACTIVAS',nl:'ACTIEF BELEID',zh:'活跃政策',hi:'सक्रिय नीतियां'},
kpi_threats_7d:       {en:'THREATS (7d)',ar:'التهديدات (7 أيام)',fr:'MENACES (7j)',es:'AMENAZAS (7d)',nl:'BEDREIGINGEN (7d)',zh:'威胁 (7天)',hi:'खतरे (7d)'},
kpi_session_cost:     {en:'SESSION COST (EST.)',ar:'تكلفة الجلسة (تقديرية)',fr:'COÛT DE LA SESSION (EST.)',es:'COSTO DE SESIÓN (EST.)',nl:'SESSIEKOSTEN (SCHATTING)',zh:'会话成本 (估计)',hi:'सत्र लागत (अनुमानित)'},
active_workflows:     {en:'ACTIVE WORKFLOWS',ar:'مسارات العمل النشطة',fr:'FLUX DE TRAVAIL ACTIFS',es:'FLUJOS DE TRABAJO ACTIVOS',nl:'ACTIEVE WERKSTROMEN',zh:'活跃的工作流',hi:'सक्रिय वर्कफ़्लो'},
workflow_onboarding:  {en:'ONBOARDING',ar:'العتبة',fr:'ONBOARDING',es:'INCORPORACIÓN',nl:'ONBOARDING',zh:'入职',hi:'ऑनबोर्डिंग'},
workflow_gate_unlock: {en:'GATE UNLOCK',ar:'فتح البوابة',fr:'DÉVERROUILLAGE DE PORTE',es:'DESBLOQUEO DE PUERTA',nl:'POORT ONTGRENDELEN',zh:'门解锁',hi:'गेट अनलॉक'},
workflow_task_complete: {en:'TASK COMPLETE',ar:'تم إكمال المهمة',fr:'TÂCHE COMPLÈTE',es:'TAREA COMPLETADA',nl:'TAAK VOLTOOID',zh:'任务完成',hi:'कार्य पूर्ण'},
workflow_dedication_award: {en:'DEDICATION AWARD',ar:'جائزة التفاني',fr:'PRIX DE DÉVOUEMENT',es:'PREMIO POR DEDICACIÓN',nl:'TOEWIJDINGSPRIJS',zh:'奉献奖',hi:'समर्पण पुरस्कार'},
workflow_data_export: {en:'DATA EXPORT',ar:'تصدير البيانات',fr:'EXPORT DE DONNÉES',es:'EXPORTACIÓN DE DATOS',nl:'GEGEVENSEXPORT',zh:'数据导出',hi:'डेटा निर्यात'},
agent_quick_access:   {en:'AGENT QUICK ACCESS',ar:'وصول سريع للوكيل',fr:'ACCÈS RAPIDE AGENT',es:'ACCESO RÁPIDO AGENTE',nl:'SNELLE AGENTTOEGANG',zh:'代理快速访问',hi:'एजेंट त्वरित पहुंच'},
full_command:         {en:'FULL COMMAND',ar:'أمر كامل',fr:'COMMANDE COMPLÈTE',es:'COMANDO COMPLETO',nl:'VOLLEDIG COMMANDO',zh:'完整命令',hi:'पूर्ण आदेश'},
admin_actions_owner_controls: {en:'ADMIN ACTIONS · OWNER CONTROLS',ar:'إجراءات المسؤول · عناصر التحكم للمالك',fr:'ACTIONS ADMINISTRATEUR · CONTRÔLES PROPRIÉTAIRE',es:'ACCIONES DE ADMINISTRADOR · CONTROLES DEL PROPIETARIO',nl:'BEHEERSACTIES · EIGENAARBESTURINGSELEMENTEN',zh:'管理员操作 · 所有者控制',hi:'प्रशासक कार्यों · मालिक नियंत्रण'},
btn_approve_access:   {en:'APPROVE ACCESS REQUESTS',ar:'الموافقة على طلبات الوصول',fr:'APPROUVER LES DEMANDES D\'ACCÈS',es:'APROBAR SOLICITUDES DE ACCESO',nl:'TOEGANGSAANVRAGEN GOEDKEUREN',zh:'批准访问请求',hi:'पहुंच अनुरोध स्वीकार करें'},
btn_sre_observatory:  {en:'SRE OBSERVATORY',ar:'مرصد موثوقية الموقع',fr:'OBSERVATOIRE SRE',es:'OBSERVATORIO SRE',nl:'SRE-OBSERVATORIUM',zh:'SRE观测站',hi:'एसआरई वेधशाला'},
btn_enterprise_control: {en:'ENTERPRISE CONTROL',ar:'التحكم في المؤسسة',fr:'CONTRÔLE ENTREPRISE',es:'CONTROL EMPRESARIAL',nl:'BEDRIJFSBEHEER',zh:'企业控制',hi:'एंटरप्राइज़ नियंत्रण'},
btn_governance_board: {en:'GOVERNANCE BOARD',ar:'مجلس الحوكمة',fr:'CONSEIL DE GOUVERNANCE',es:'JUNTA DIRECTIVA',nl:'BESTUURSKAMER',zh:'治理委员会',hi:'शासन बोर्ड'},
btn_evolution_roadmap: {en:'EVOLUTION ROADMAP',ar:'خريطة الطريق للتطور',fr:'FEUILLE DE ROUTE ÉVOLUTION',es:'HOJA DE RUTA EVOLUCIÓN',nl:'EVOLUTIEROUTEKAART',zh:'进化路线图',hi:'विकास रोडमैप'},
btn_privacy_centre:   {en:'PRIVACY CENTRE',ar:'مركز الخصوصية',fr:'CENTRE DE CONFIDENTIALITÉ',es:'CENTRO DE PRIVACIDAD',nl:'PRIVACYCENTRUM',zh:'隐私中心',hi:'गोपनीयता केंद्र'},

/* ── SCIENCE SECTION ── */
sovereign_constants_system_architecture: {en:'SOVEREIGN CONSTANTS & SYSTEM ARCHITECTURE',ar:'ثوابت السيادة وبنية النظام',fr:'CONSTANTES SOUVERAINES & ARCHITECTURE SYSTÈME',es:'CONSTANTES SOBERANAS & ARQUITECTURA DEL SISTEMA',nl:'SOEVEREINE CONSTANTEN & SYSTEEMARCHITECTUUR',zh:'主权常数和系统架构',hi:'संप्रभु स्थिरांक और सिस्टम आर्किटेक्चर'},
constant_phi:         {en:'PHI (φ)',ar:'فاي (φ)',fr:'PHI (φ)',es:'PHI (φ)',nl:'PHI (φ)',zh:'φ值',hi:'फाई (φ)'},
constant_euler:       {en:'EULER (e)',ar:'يولر (e)',fr:'EULER (e)',es:'EULER (e)',nl:'EULER (e)',zh:'欧拉数',hi:'यूलर (e)'},
constant_authority_apex: {en:'AUTHORITY APEX',ar:'ذروة السلطة',fr:'APEX D\'AUTORITÉ',es:'ÁPICE DE AUTORIDAD',nl:'AUTORITEITSAPEX',zh:'权力顶峰',hi:'प्राधिकरण शिखर'},
constant_trial_window: {en:'TRIAL WINDOW',ar:'نافذة المحاكمة',fr:'FENÊTRE D\'ESSAI',es:'VENTANA DE PRUEBA',nl:'PROEFVENSTER',zh:'试用期',hi:'परीक्षण खिड़की'},
constant_lattice:     {en:'LATTICE',ar:'الشبكة',fr:'TREILLIS',es:'CELOSÍA',nl:'ROOSTER',zh:'格子',hi:'जाली'},
constant_platform_pages: {en:'PLATFORM PAGES',ar:'صفحات المنصة',fr:'PAGES PLATEFORME',es:'PÁGINAS DE PLATAFORMA',nl:'PLATFORMPAGINA\'S',zh:'平台页面',hi:'प्लेटफॉर्म पृष्ठ'},
constant_sql_files:   {en:'SQL FILES',ar:'ملفات SQL',fr:'FICHIERS SQL',es:'ARCHIVOS SQL',nl:'SQL-BESTANDEN',zh:'SQL文件',hi:'एसक्यूएल फ़ाइलें'},
gate_thresholds_12_levels: {en:'GATE THRESHOLDS · 12 SOVEREIGN LEVELS',ar:'حدود البوابة · 12 مستوى سيادي',fr:'SEUILS DE PORTE · 12 NIVEAUX SOUVERAINS',es:'UMBRALES DE PUERTA · 12 NIVELES SOBERANOS',nl:'POORTDREMPELS · 12 SOEVEREINE NIVEAUS',zh:'门槛值 · 12个主权级别',hi:'गेट थ्रेसहोल्ड · 12 संप्रभु स्तर'},
gate_1_initiate:      {en:'GATE 1 — INITIATE',ar:'البوابة 1 — البدء',fr:'PORTE 1 — INITIER',es:'PUERTA 1 — INICIAR',nl:'POORT 1 — INITIALISEREN',zh:'门1 — 启动',hi:'गेट 1 — शुरू करें'},
gate_2_acolyte:       {en:'GATE 2 — ACOLYTE',ar:'البوابة 2 — تابع',fr:'PORTE 2 — ACOLYTE',es:'PUERTA 2 — ACÓLITO',nl:'POORT 2 — ACOLIET',zh:'门2 — 助手',hi:'गेट 2 — अनुयायी'},
gate_3_scholar:       {en:'GATE 3 — SCHOLAR',ar:'البوابة 3 — عالم',fr:'PORTE 3 — ÉRUDIT',es:'PUERTA 3 — ERUDITO',nl:'POORT 3 — GELEERDE',zh:'门3 — 学者',hi:'गेट 3 — विद्वान'},
gate_4_keeper:        {en:'GATE 4 — KEEPER',ar:'البوابة 4 — حارس',fr:'PORTE 4 — GARDIEN',es:'PUERTA 4 — GUARDIÁN',nl:'POORT 4 — BEWAARDER',zh:'门4 — 守护者',hi:'गेट 4 — रक्षक'},
gate_5_guardian:      {en:'GATE 5 — GUARDIAN',ar:'البوابة 5 — حامي',fr:'PORTE 5 — GARDIEN',es:'PUERTA 5 — GUARDIÁN',nl:'POORT 5 — BESCHERMER',zh:'门5 — 卫士',hi:'गेट 5 — संरक्षक'},
gate_6_architect:     {en:'GATE 6 — ARCHITECT',ar:'البوابة 6 — معماري',fr:'PORTE 6 — ARCHITECTE',es:'PUERTA 6 — ARQUITECTO',nl:'POORT 6 — ARCHITECT',zh:'门6 — 建筑师',hi:'गेट 6 — आर्किटेक्ट'},
gate_7_sovereign:     {en:'GATE 7 — SOVEREIGN',ar:'البوابة 7 — سيادي',fr:'PORTE 7 — SOUVERAIN',es:'PUERTA 7 — SOBERANO',nl:'POORT 7 — SOEVEREIN',zh:'门7 — 主权',hi:'गेट 7 — संप्रभु'},
gate_8_vanguard:      {en:'GATE 8 — VANGUARD',ar:'البوابة 8 — طليعة',fr:'PORTE 8 — AVANT-GARDE',es:'PUERTA 8 — VANGUARDIA',nl:'POORT 8 — VOORHOEDE',zh:'门8 — 先锋',hi:'गेट 8 — अग्रदूत'},
gate_9_herald:        {en:'GATE 9 — HERALD',ar:'البوابة 9 — مبشر',fr:'PORTE 9 — HÉRAUT',es:'PUERTA 9 — HERALDO',nl:'POORT 9 — HERAUT',zh:'门9 — 传令官',hi:'गेट 9 — दूत'},
gate_10_oracle:       {en:'GATE 10 — ORACLE',ar:'البوابة 10 — عرّاف',fr:'PORTE 10 — ORACLE',es:'PUERTA 10 — ORÁCULO',nl:'POORT 10 — ORAKEL',zh:'门10 — 神谕',hi:'गेट 10 — भविष्यवक्ता'},
gate_11_prime:        {en:'GATE 11 — PRIME',ar:'البوابة 11 — أول',fr:'PORTE 11 — PREMIER',es:'PUERTA 11 — PRIMERO',nl:'POORT 11 — PRIMAIR',zh:'门11 — 至尊',hi:'गेट 11 — प्रमुख'},
gate_12_apex:         {en:'GATE 12 — APEX',ar:'البوابة 12 — ذروة',fr:'PORTE 12 — APEX',es:'PUERTA 12 — ÁPEX',nl:'POORT 12 — APEX',zh:'门12 — 顶峰',hi:'गेट 12 — शिखर'},
invisible_architect:  {en:'INVISIBLE ARCHITECT',ar:'المعماري غير المرئي',fr:'ARCHITECTE INVISIBLE',es:'ARQUITECTO INVISIBLE',nl:'ONZICHTBARE ARCHITECT',zh:'隐形建筑师',hi:'अदृश्य आर्किटेक्ट'},

/* ── TIMELINE SECTION ── */
live_timeline_events: {en:'LIVE TIMELINE · RECENT SOVEREIGN EVENTS',ar:'الجدول الزمني المباشر · أحداث سيادية حديثة',fr:'CHRONOLOGIE EN DIRECT · ÉVÉNEMENTS SOUVERAINS RÉCENTS',es:'CRONOLOGÍA EN VIVO · EVENTOS SOBERANOS RECIENTES',nl:'LIVE TIJDLIJN · RECENTE SOEVEREINE EVENEMENTEN',zh:'实时时间线 · 最近的主权事件',hi:'लाइव टाइमलाइन · हाल की संप्रभु घटनाएं'},

/* ── APPROVALS / OWNER ADMIN CONSOLE ── */
approvals_title:              {en:'INVISIBLE ARCHITECT CONSOLE',ar:'وحدة تحكم المعماري غير المرئي',fr:'CONSOLE DE L\'ARCHITECTE INVISIBLE',es:'CONSOLA DEL ARQUITECTO INVISIBLE',nl:'CONSOLE VAN ONZICHTBARE ARCHITECT',zh:'隐形建筑师控制台',hi:'अदृश्य आर्किटेक्ट कंसोल'},
access_denied:                {en:'ACCESS DENIED',ar:'تم رفض الوصول',fr:'ACCÈS REFUSÉ',es:'ACCESO DENEGADO',nl:'TOEGANG GEWEIGERD',zh:'访问被拒绝',hi:'पहुंच अस्वीकृत'},
approvals_subtitle:           {en:'SOVEREIGN ACCESS CONTROL · OWNER-ONLY · ALL-TIME · IRREVOCABLE',ar:'التحكم في الوصول السيادي · مالك فقط · في كل وقت · لا رجعة فيه',fr:'CONTRÔLE D\'ACCÈS SOUVERAIN · PROPRIÉTAIRE UNIQUEMENT · TOUT TEMPS · IRRÉVOCABLE',es:'CONTROL DE ACCESO SOBERANO · SOLO PROPIETARIO · TODO TIEMPO · IRREVOCABLE',nl:'SOEVEREINE TOEGANGSBEHEER · ALLEEN EIGENAAR · ALTIJD · ONHERROEPELIJK',zh:'主权访问控制 · 仅所有者 · 全时 · 不可撤销',hi:'संप्रभु पहुंच नियंत्रण · केवल मालिक · सभी समय · अपरिवर्तनीय'},
tab_members:                  {en:'MEMBERS',ar:'الأعضاء',fr:'MEMBRES',es:'MIEMBROS',nl:'LEDEN',zh:'成员',hi:'सदस्य'},
tab_operations:               {en:'OPERATIONS',ar:'العمليات',fr:'OPÉRATIONS',es:'OPERACIONES',nl:'OPERATIES',zh:'运营',hi:'संचालन'},
tab_audit:                    {en:'AUDIT',ar:'التدقيق',fr:'AUDIT',es:'AUDITORÍA',nl:'CONTROLE',zh:'审计',hi:'लेखापरीक्षा'},
tab_science:                  {en:'SCIENCE',ar:'العلوم',fr:'SCIENCE',es:'CIENCIA',nl:'WETENSCHAP',zh:'科学',hi:'विज्ञान'},
section_access_control:       {en:'ACCESS CONTROL — MEMBER ROSTER',ar:'التحكم في الوصول — قائمة الأعضاء',fr:'CONTRÔLE D\'ACCÈS — LISTE DES MEMBRES',es:'CONTROL DE ACCESO — LISTA DE MIEMBROS',nl:'TOEGANGSBEHEER — LEDENLIJST',zh:'访问控制 — 成员名单',hi:'पहुंच नियंत्रण — सदस्य रोस्टर'},
section_contract_queue:       {en:'CONTRACT QUEUE',ar:'طابور العقود',fr:'FILE D\'ATTENTE DES CONTRATS',es:'COLA DE CONTRATOS',nl:'CONTRACTWACHTRIJ',zh:'合同队列',hi:'अनुबंध कतार'},
section_reservation_queue:    {en:'RESERVATION QUEUE',ar:'طابور الحجوزات',fr:'FILE D\'ATTENTE DES RÉSERVATIONS',es:'COLA DE RESERVACIONES',nl:'RESERVERINGSWACHTRIJ',zh:'预订队列',hi:'आरक्षण कतार'},
section_sovereign_dispatch:   {en:'SOVEREIGN DISPATCH',ar:'الإرسال السيادي',fr:'EXPÉDITION SOUVERAINE',es:'ENVÍO SOBERANO',nl:'SOEVEREINE VERZENDING',zh:'主权调度',hi:'संप्रभु प्रेषण'},
status_pending:               {en:'PENDING',ar:'قيد الانتظار',fr:'EN ATTENTE',es:'PENDIENTE',nl:'IN AFWACHTING',zh:'待定',hi:'लंबित'},
status_trial_active:          {en:'TRIAL ACTIVE',ar:'التجربة نشطة',fr:'ESSAI ACTIF',es:'PRUEBA ACTIVA',nl:'PROEF ACTIEF',zh:'试用中',hi:'परीक्षण सक्रिय'},
status_permanent:             {en:'PERMANENT',ar:'دائم',fr:'PERMANENT',es:'PERMANENTE',nl:'PERMANENT',zh:'永久',hi:'स्थायी'},
status_rejected:              {en:'REJECTED',ar:'مرفوضة',fr:'REJETÉE',es:'RECHAZADA',nl:'AFGEWEZEN',zh:'已拒绝',hi:'अस्वीकृत'},
status_expired:               {en:'EXPIRED',ar:'منتهي الصلاحية',fr:'EXPIRÉ',es:'VENCIDA',nl:'VERLOPEN',zh:'已过期',hi:'समाप्त हुआ'},
filter_all_members:           {en:'ALL MEMBERS',ar:'جميع الأعضاء',fr:'TOUS LES MEMBRES',es:'TODOS LOS MIEMBROS',nl:'ALLE LEDEN',zh:'所有成员',hi:'सभी सदस्य'},
form_dispatch_title:          {en:'DISPATCH TITLE',ar:'عنوان الإرسال',fr:'TITRE DE L\'EXPÉDITION',es:'TÍTULO DEL ENVÍO',nl:'VERZENDTITEL',zh:'调度标题',hi:'प्रेषण शीर्षक'},
form_select_category:         {en:'SELECT CATEGORY',ar:'اختر الفئة',fr:'SÉLECTIONNER LA CATÉGORIE',es:'SELECCIONAR CATEGORÍA',nl:'CATEGORIE SELECTEREN',zh:'选择类别',hi:'श्रेणी चुनें'},
form_dispatch_content:        {en:'SOVEREIGN DISPATCH CONTENT...',ar:'محتوى الإرسال السيادي...',fr:'CONTENU DE L\'EXPÉDITION SOUVERAINE...',es:'CONTENIDO DEL ENVÍO SOBERANO...',nl:'SOEVEREINE VERZENDINHOUD...',zh:'主权调度内容...',hi:'संप्रभु प्रेषण सामग्री...'},
dispatch_category_decree:     {en:'SOVEREIGN DECREE',ar:'مرسوم سيادي',fr:'DÉCRET SOUVERAIN',es:'DECRETO SOBERANO',nl:'SOEVEREIN DECREET',zh:'主权令',hi:'संप्रभु अध्यादेश'},
dispatch_category_system_update: {en:'SYSTEM UPDATE',ar:'تحديث النظام',fr:'MISE À JOUR SYSTÈME',es:'ACTUALIZACIÓN DEL SISTEMA',nl:'SYSTEEMUPDATE',zh:'系统更新',hi:'सिस्टम अपडेट'},
dispatch_category_market_signal: {en:'MARKET SIGNAL',ar:'إشارة السوق',fr:'SIGNAL DE MARCHÉ',es:'SEÑAL DE MERCADO',nl:'MARKTSIGNAAL',zh:'市场信号',hi:'बाजार संकेत'},
dispatch_category_heritage_note: {en:'HERITAGE NOTE',ar:'ملاحظة التراث',fr:'NOTE D\'HÉRITAGE',es:'NOTA DE HERENCIA',nl:'ERFGOEDBERICHT',zh:'遗产说明',hi:'विरासत नोट'},
dispatch_category_announcement: {en:'ORDER ANNOUNCEMENT',ar:'إعلان الأمر',fr:'ANNONCE DE COMMANDE',es:'ANUNCIO DE ORDEN',nl:'ORDERAANKONDIGING',zh:'订单公告',hi:'आदेश घोषणा'},
btn_grant_trial:              {en:'GRANT TRIAL',ar:'منح التجربة',fr:'ACCORDER UN ESSAI',es:'OTORGAR PRUEBA',nl:'PROEF VERLENEN',zh:'授予试用',hi:'परीक्षण अनुमति दें'},
btn_grant_permanent:          {en:'PERMANENT',ar:'دائم',fr:'PERMANENT',es:'PERMANENTE',nl:'PERMANENT',zh:'永久',hi:'स्थायी'},
btn_extend_trial:             {en:'EXTEND +9:17',ar:'تمديد +9:17',fr:'PROLONGER +9:17',es:'EXTENDER +9:17',nl:'VERLENGEN +9:17',zh:'延长 +9:17',hi:'विस्तार +9:17'},
btn_revoke_access:            {en:'REVOKE',ar:'إلغاء',fr:'RÉVOQUER',es:'REVOCAR',nl:'INTREKKEN',zh:'撤销',hi:'रद्द करें'},
btn_renew_trial:              {en:'RENEW TRIAL',ar:'تجديد التجربة',fr:'RENOUVELER L\'ESSAI',es:'RENOVAR PRUEBA',nl:'PROEF VERLENGEN',zh:'续签试用',hi:'परीक्षा नवीनीकृत करें'},
btn_reconsider:               {en:'RECONSIDER',ar:'إعادة النظر',fr:'RECONSIDÉRER',es:'RECONSIDERAR',nl:'HEROVERWEGEN',zh:'重新考虑',hi:'पुनर्विचार करें'},
toast_trial_granted:          {en:'✓ TRIAL GRANTED — {TIME}',ar:'✓ تم منح التجربة — {TIME}',fr:'✓ ESSAI ACCORDÉ — {TIME}',es:'✓ PRUEBA OTORGADA — {TIME}',nl:'✓ PROEF VERLEEND — {TIME}',zh:'✓ 试用已授予 — {TIME}',hi:'✓ परीक्षा दी गई — {TIME}'},
toast_permanent_granted:      {en:'∞ PERMANENT ACCESS GRANTED',ar:'∞ تم منح الوصول الدائم',fr:'∞ ACCÈS PERMANENT ACCORDÉ',es:'∞ ACCESO PERMANENTE OTORGADO',nl:'∞ PERMANENTE TOEGANG VERLEEND',zh:'∞ 永久访问已授予',hi:'∞ स्थायी पहुंच दी गई'},
toast_rejected:               {en:'✕ REQUEST REJECTED',ar:'✕ تم رفض الطلب',fr:'✕ DEMANDE REJETÉE',es:'✕ SOLICITUD RECHAZADA',nl:'✕ VERZOEK AFGEWEZEN',zh:'✕ 请求被拒绝',hi:'✕ अनुरोध अस्वीकृत'},
toast_revoked:                {en:'■ ACCESS REVOKED',ar:'■ تم إلغاء الوصول',fr:'■ ACCÈS RÉVOQUÉ',es:'■ ACCESO REVOCADO',nl:'■ TOEGANG INGETROKKEN',zh:'■ 访问已撤销',hi:'■ पहुंच रद्द की गई'},
toast_dispatch_sent:          {en:'✓ DISPATCH TRANSMITTED',ar:'✓ تم إرسال الإرسالية',fr:'✓ EXPÉDITION TRANSMISE',es:'✓ ENVÍO TRANSMITIDO',nl:'✓ VERZENDING VERZONDEN',zh:'✓ 调度已传输',hi:'✓ प्रेषण प्रेषित'},
timeline_requested:           {en:'REQUESTED',ar:'مطلوب',fr:'DEMANDÉ',es:'SOLICITADO',nl:'AANGEVRAAGD',zh:'已请求',hi:'अनुरोध किया गया'},
timeline_trial_started:       {en:'TRIAL STARTED',ar:'بدأت التجربة',fr:'ESSAI COMMENCÉ',es:'PRUEBA INICIADA',nl:'PROEF GESTART',zh:'试用开始',hi:'परीक्षा शुरू'},
timeline_trial_expires:       {en:'TRIAL EXPIRES',ar:'انتهاء التجربة',fr:'ESSAI EXPIRE',es:'PRUEBA VENCE',nl:'PROEF VERLOOPT',zh:'试用到期',hi:'परीक्षा समाप्त'},
timeline_access_type:         {en:'ACCESS TYPE',ar:'نوع الوصول',fr:'TYPE D\'ACCÈS',es:'TIPO DE ACCESO',nl:'TOEGANGSTYPE',zh:'访问类型',hi:'पहुंच प्रकार'},
timeline_sign_element:        {en:'SIGN / ELEMENT',ar:'الإشارة / العنصر',fr:'SIGNE / ÉLÉMENT',es:'SIGNO / ELEMENTO',nl:'TEKEN / ELEMENT',zh:'标志 / 元素',hi:'संकेत / तत्व'},
timeline_authority:           {en:'AUTHORITY',ar:'السلطة',fr:'AUTORITÉ',es:'AUTORIDAD',nl:'AUTORITEIT',zh:'权限',hi:'प्राधिकार'},
empty_no_members:             {en:'NO MEMBERS IN THIS VIEW',ar:'لا توجد أعضاء في هذا العرض',fr:'AUCUN MEMBRE DANS CETTE VUE',es:'SIN MIEMBROS EN ESTA VISTA',nl:'GEEN LEDEN IN DEZE WEERGAVE',zh:'此视图中没有成员',hi:'इस दृश्य में कोई सदस्य नहीं'},
empty_no_contracts:           {en:'NO PENDING CONTRACTS',ar:'لا توجد عقود معلقة',fr:'AUCUN CONTRAT EN ATTENTE',es:'SIN CONTRATOS PENDIENTES',nl:'GEEN OPENSTAANDE CONTRACTEN',zh:'没有待处理的合同',hi:'कोई लंबित अनुबंध नहीं'},
empty_no_reservations:        {en:'NO PENDING RESERVATIONS',ar:'لا توجد حجوزات معلقة',fr:'AUCUNE RÉSERVATION EN ATTENTE',es:'SIN RESERVACIONES PENDIENTES',nl:'GEEN OPENSTAANDE RESERVERINGEN',zh:'没有待处理的预订',hi:'कोई लंबित आरक्षण नहीं'},
empty_no_audit:               {en:'NO AUDIT ENTRIES',ar:'لا توجد إدخالات التدقيق',fr:'AUCUNE ENTRÉE D\'AUDIT',es:'SIN ENTRADAS DE AUDITORÍA',nl:'GEEN CONTROLEPOSTEN',zh:'没有审计条目',hi:'कोई लेखापरीक्षा प्रविष्टि नहीं'},
empty_no_errors:              {en:'NO CLIENT ERRORS RECORDED',ar:'لم يتم تسجيل أخطاء العميل',fr:'AUCUNE ERREUR CLIENT ENREGISTRÉE',es:'SIN ERRORES DE CLIENTE REGISTRADOS',nl:'GEEN CLIENTFOUTEN GEREGISTREERD',zh:'未记录客户端错误',hi:'कोई क्लाइंट त्रुटि दर्ज नहीं'},
error_rpc_contract:           {en:'CONTRACT RPC NOT AVAILABLE',ar:'RPC العقد غير متاح',fr:'RPC DE CONTRAT INDISPONIBLE',es:'RPC DE CONTRATO NO DISPONIBLE',nl:'CONTRACT RPC NIET BESCHIKBAAR',zh:'合同 RPC 不可用',hi:'अनुबंध RPC उपलब्ध नहीं'},
error_rpc_reservations:       {en:'RESERVATIONS RPC NOT AVAILABLE',ar:'RPC الحجوزات غير متاح',fr:'RPC DES RÉSERVATIONS INDISPONIBLE',es:'RPC DE RESERVACIONES NO DISPONIBLE',nl:'RESERVERINGEN RPC NIET BESCHIKBAAR',zh:'预订 RPC 不可用',hi:'आरक्षण RPC उपलब्ध नहीं'},
error_rpc_audit:              {en:'AUDIT LOG RPC NOT AVAILABLE',ar:'RPC سجل التدقيق غير متاح',fr:'RPC DE JOURNAL D\'AUDIT INDISPONIBLE',es:'RPC DE REGISTRO DE AUDITORÍA NO DISPONIBLE',nl:'AUDITLOGBOEK RPC NIET BESCHIKBAAR',zh:'审计日志 RPC 不可用',hi:'लेखापरीक्षा लॉग RPC उपलब्ध नहीं'},
error_rpc_errors:             {en:'ERROR MONITOR RPC NOT AVAILABLE',ar:'RPC مراقب الأخطاء غير متاح',fr:'RPC DU MONITEUR D\'ERREURS INDISPONIBLE',es:'RPC DE MONITOR DE ERRORES NO DISPONIBLE',nl:'FOUTMONITOR RPC NIET BESCHIKBAAR',zh:'错误监视器 RPC 不可用',hi:'त्रुटि मॉनिटर RPC उपलब्ध नहीं'},
label_remaining:              {en:'REMAINING',ar:'متبقي',fr:'RESTANT',es:'RESTANTE',nl:'RESTEREND',zh:'剩余',hi:'शेष'},
btn_transmit_dispatch:        {en:'TRANSMIT DISPATCH',ar:'نقل البث',fr:'ENVOYER L\'ANNONCE',es:'TRANSMITIR DESPACHO',nl:'VERZENDEN DEPECHE',zh:'传输公告',hi:'प्रेषण भेजें'},
section_audit_log:            {en:'ACCESS AUDIT LOG',ar:'سجل تدقيق الوصول',fr:'JOURNAL D\'AUDIT D\'ACCÈS',es:'REGISTRO DE AUDITORÍA DE ACCESO',nl:'TOEGANGSAUDITLOGBOEK',zh:'访问审计日志',hi:'पहुँच लेखापरीक्षा लॉग'},
section_error_monitor:        {en:'CLIENT ERROR MONITOR',ar:'مراقب أخطاء العميل',fr:'MONITEUR D\'ERREURS CLIENT',es:'MONITOR DE ERRORES DEL CLIENTE',nl:'CLIENTFOUTMONITOR',zh:'客户端错误监视器',hi:'क्लाइंट त्रुटि मॉनिटर'},
toast_extend_trial:           {en:'↻ EXTENDED +9:17 MINUTES',ar:'↻ موسع +9:17 دقيقة',fr:'↻ ÉTENDU +9:17 MINUTES',es:'↻ EXTENDIDO +9:17 MINUTOS',nl:'↻ VERLENGD +9:17 MINUTEN',zh:'↻ 已延长 +9:17 分钟',hi:'↻ विस्तारित +9:17 मिनट'},
error_dispatch_empty:         {en:'FILL TITLE AND BODY',ar:'ملء العنوان والمحتوى',fr:'REMPLIR LE TITRE ET LE CORPS',es:'COMPLETAR TÍTULO Y CUERPO',nl:'TITEL EN INHOUD INVULLEN',zh:'填写标题和正文',hi:'शीर्षक और निकाय भरें'},
error_dispatch_rpc:           {en:'DISPATCH FAILED — post_dispatch RPC unavailable. Try again shortly.',ar:'فشل البث — post_dispatch RPC غير متاح. حاول مرة أخرى قريبا.',fr:'ENVOI ÉCHOUÉ — post_dispatch RPC indisponible. Réessayez bientôt.',es:'DESPACHO FALLIDO — post_dispatch RPC no disponible. Intente de nuevo en breve.',nl:'VERZENDING MISLUKT — post_dispatch RPC niet beschikbaar. Probeer binnenkort opnieuw.',zh:'分发失败 — post_dispatch RPC 不可用。请稍后重试。',hi:'प्रेषण विफल — post_dispatch RPC उपलब्ध नहीं। शीघ्र ही पुनः प्रयास करें।'},
gate_access_denied_subtitle:  {en:'THIS CONSOLE IS RESTRICTED TO THE INVISIBLE ARCHITECT',ar:'هذه الوحدة مقيدة على المعماري غير المرئي',fr:'CETTE CONSOLE EST RÉSERVÉE À L\'ARCHITECTE INVISIBLE',es:'ESTA CONSOLA ESTÁ RESTRINGIDA AL ARQUITECTO INVISIBLE',nl:'DEZE CONSOLE IS BEPERKT TOT DE ONZICHTBARE ARCHITECT',zh:'此控制台仅限隐形建筑师使用',hi:'यह कंसोल अदृश्य आर्किटेक्ट के लिए प्रतिबंधित है'},
btn_return_dashboard:         {en:'RETURN TO DASHBOARD',ar:'العودة إلى لوحة التحكم',fr:'RETOUR AU TABLEAU DE BORD',es:'VOLVER AL PANEL',nl:'TERUG NAAR DASHBOARD',zh:'返回控制面板',hi:'डैशबोर्ड पर लौटें'},
};

/* ── ENGINE ── */
var _lang=localStorage.getItem('omega_lang')||'en';

function getLang(){return _lang;}

function translate(lang){
  lang=lang||_lang;
  if(!LANGS[lang])lang='en';
  _lang=lang;
  localStorage.setItem('omega_lang',lang);

  /* RTL / LTR */
  document.documentElement.setAttribute('dir',LANGS[lang].dir);
  document.documentElement.setAttribute('lang',lang);

  /* Apply translations */
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key=el.getAttribute('data-i18n');
    var entry=T[key];
    if(entry){
      var txt=entry[lang]||entry['en']||key;
      if(el.tagName==='INPUT'||el.tagName==='TEXTAREA'){
        el.placeholder=txt;
      } else if(el.tagName==='IMG'){
        el.alt=txt;
      } else {
        el.textContent=txt;
      }
    }
  });

  /* Update lang selector buttons */
  document.querySelectorAll('[data-lang]').forEach(function(btn){
    btn.classList.toggle('on',btn.getAttribute('data-lang')===lang);
  });

  /* Dispatch event so pages can react */
  document.dispatchEvent(new CustomEvent('omega:lang',{detail:{lang:lang,dir:LANGS[lang].dir}}));
}

function t(key,lang){
  lang=lang||_lang;
  var e=T[key];
  return e?(e[lang]||e['en']||key):key;
}

/* Auto-translate on DOMContentLoaded */
document.addEventListener('DOMContentLoaded',function(){translate(_lang);});

/* Expose */
window.OmegaI18n={translate:translate,t:t,getLang:getLang,LANGS:LANGS,T:T};
window.omegaTranslate=translate;
})();

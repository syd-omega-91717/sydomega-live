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

/* ── DASHBOARD ── */
cmd_bridge:           {en:'Command Bridge',ar:'جسر القيادة',fr:'Pont de commandement',es:'Puente de mando',nl:'Commandobrug',zh:'指挥桥',hi:'कमांड ब्रिज'},
operational:          {en:'OPERATIONAL',ar:'تشغيلي',fr:'OPÉRATIONNEL',es:'OPERACIONAL',nl:'OPERATIONEEL',zh:'运作中',hi:'परिचालन'},
auth_apex:            {en:'AUTH APEX',ar:'قمة الاعتماد',fr:'APEX AUTH',es:'ÁPEX AUTH',nl:'AUTH APEX',zh:'权威顶点',hi:'प्राधिकार शिखर'},
lattice_nodes:        {en:'LATTICE NODES',ar:'عقد الشبكة',fr:'NŒUDS LATTICE',es:'NODOS DE LATTICE',nl:'LATTICE-KNOOPPUNTEN',zh:'晶格节点',hi:'जाली नोड्स'},
js_engines:           {en:'JS ENGINES',ar:'محركات JS',fr:'MOTEURS JS',es:'MOTORES JS',nl:'JS-MOTOREN',zh:'JS引擎',hi:'जेएस इंजन'},
pages:                {en:'PAGES',ar:'صفحات',fr:'PAGES',es:'PÁGINAS',nl:'PAGINA\'S',zh:'页面',hi:'पृष्ठ'},
sql_files:            {en:'SQL FILES',ar:'ملفات SQL',fr:'FICHIERS SQL',es:'ARCHIVOS SQL',nl:'SQL-BESTANDEN',zh:'SQL文件',hi:'एसक्यूएल फाइलें'},
my_gate:              {en:'MY GATE',ar:'بوابتي',fr:'MA PORTE',es:'MI PUERTA',nl:'MIJN POORT',zh:'我的大门',hi:'मेरा गेट'},
my_element:           {en:'MY ELEMENT',ar:'عنصري',fr:'MON ÉLÉMENT',es:'MI ELEMENTO',nl:'MIJN ELEMENT',zh:'我的元素',hi:'मेरा तत्व'},
formula:              {en:'FORMULA',ar:'الصيغة',fr:'FORMULE',es:'FÓRMULA',nl:'FORMULE',zh:'公式',hi:'सूत्र'},

/* ── DASHBOARD TABS ── */
tab_overview:         {en:'OVERVIEW',ar:'نظرة عامة',fr:'APERÇU',es:'DESCRIPCIÓN',nl:'OVERZICHT',zh:'概览',hi:'अवलोकन'},
tab_personal:         {en:'PERSONAL',ar:'شخصي',fr:'PERSONNEL',es:'PERSONAL',nl:'PERSOONLIJK',zh:'个人',hi:'व्यक्तिगत'},
tab_platform:         {en:'PLATFORM',ar:'منصة',fr:'PLATEFORME',es:'PLATAFORMA',nl:'PLATFORM',zh:'平台',hi:'प्लेटफॉर्म'},
tab_science:          {en:'SCIENCE',ar:'العلم',fr:'SCIENCE',es:'CIENCIA',nl:'WETENSCHAP',zh:'科学',hi:'विज्ञान'},

/* ── DASHBOARD KPIs ── */
my_authority:         {en:'MY AUTHORITY',ar:'سلطتي',fr:'MON AUTORITÉ',es:'MI AUTORIDAD',nl:'MIJN GEZAG',zh:'我的权威',hi:'मेरी प्राधिकार'},
access_approved:      {en:'ACCESS APPROVED',ar:'تم الموافقة على الوصول',fr:'ACCÈS APPROUVÉ',es:'ACCESO APROBADO',nl:'TOEGANG GOEDGEKEURD',zh:'访问已批准',hi:'पहुँच को मंजूरी दी गई'},
active_members:       {en:'ACTIVE MEMBERS',ar:'أعضاء نشطون',fr:'MEMBRES ACTIFS',es:'MIEMBROS ACTIVOS',nl:'ACTIEVE LEDEN',zh:'活跃成员',hi:'सक्रिय सदस्य'},
online_now:           {en:'ONLINE NOW',ar:'متصل الآن',fr:'EN LIGNE MAINTENANT',es:'EN LÍNEA AHORA',nl:'NU ONLINE',zh:'现在在线',hi:'अभी ऑनलाइन'},
live_presence:        {en:'LIVE PRESENCE',ar:'الحضور المباشر',fr:'PRÉSENCE EN DIRECT',es:'PRESENCIA EN VIVO',nl:'LIVE AANWEZIGHEID',zh:'实时存在',hi:'लाइव उपस्थिति'},
tasks_today:          {en:'TASKS TODAY',ar:'المهام اليوم',fr:'TÂCHES AUJOURD\'HUI',es:'TAREAS HOY',nl:'TAKEN VANDAAG',zh:'今日任务',hi:'आज के कार्य'},
axis_increments:      {en:'AXIS INCREMENTS',ar:'زيادات المحور',fr:'INCRÉMENTS AXIS',es:'INCREMENTOS DE EJE',nl:'ASHEEL VERHOGINGEN',zh:'轴增量',hi:'अक्ष वृद्धि'},
platform_pmi:         {en:'PLATFORM PMI',ar:'مؤشر أداء المنصة',fr:'IMT PLATEFORME',es:'PMI DE PLATAFORMA',nl:'PLATFORM PMI',zh:'平台PMI',hi:'प्लेटफॉर्म पीएमआई'},
meaning_index:        {en:'MEANING INDEX',ar:'مؤشر المعنى',fr:'INDICE DE SENS',es:'ÍNDICE DE SIGNIFICADO',nl:'BETEKENISINDEX',zh:'意义指数',hi:'अर्थ सूचकांक'},
slo_uptime:           {en:'SLO UPTIME',ar:'وقت التشغيل SLO',fr:'DISPONIBILITÉ SLO',es:'TIEMPO DE ACTIVIDAD SLO',nl:'SLO BEDRIJFSTIJD',zh:'SLO正常运行时间',hi:'एसएलओ अपटाइम'},
thirty_day:           {en:'30-DAY',ar:'30 يوم',fr:'30 JOURS',es:'30 DÍAS',nl:'30 DAGEN',zh:'30天',hi:'30-दिन'},
open_risks:           {en:'OPEN RISKS',ar:'المخاطر المفتوحة',fr:'RISQUES OUVERTS',es:'RIESGOS ABIERTOS',nl:'OPEN RISICO\'S',zh:'开放风险',hi:'खुले जोखिम'},
iso_27001:            {en:'ISO 27001',ar:'ISO 27001',fr:'ISO 27001',es:'ISO 27001',nl:'ISO 27001',zh:'ISO 27001',hi:'ISO 27001'},
events_today:         {en:'EVENTS TODAY',ar:'الأحداث اليوم',fr:'ÉVÉNEMENTS AUJOURD\'HUI',es:'EVENTOS HOY',nl:'EVENEMENTEN VANDAAG',zh:'今日事件',hi:'आज की घटनाएँ'},
platform_pulse:       {en:'PLATFORM PULSE',ar:'نبض المنصة',fr:'POULS DE LA PLATEFORME',es:'PULSO DE LA PLATAFORMA',nl:'PLATFORMPULS',zh:'平台脉搏',hi:'प्लेटफॉर्म पल्स'},
gates_reached:        {en:'GATES REACHED',ar:'البوابات التي تم الوصول إليها',fr:'PORTES ATTEINTES',es:'PUERTAS ALCANZADAS',nl:'BEREIKT POORTEN',zh:'到达的大门',hi:'पहुँचे गए गेट्स'},
of_12:                {en:'of 12',ar:'من 12',fr:'de 12',es:'de 12',nl:'van 12',zh:'共12个',hi:'12 में से'},

/* ── DASHBOARD SECTIONS ── */
system_galaxy:        {en:'SYSTEM GALAXY',ar:'مجرة النظام',fr:'GALAXIE SYSTÈME',es:'GALAXIA DEL SISTEMA',nl:'SYSTEEMGALAXIE',zh:'系统星系',hi:'सिस्टम गैलेक्सी'},
sovereign_modules:    {en:'18 SOVEREIGN MODULES',ar:'18 وحدة سيادية',fr:'18 MODULES SOUVERAINS',es:'18 MÓDULOS SOBERANOS',nl:'18 SOEVEREINE MODULES',zh:'18个主权模块',hi:'18 संप्रभु मॉड्यूल'},
click_navigate:       {en:'CLICK TO NAVIGATE',ar:'انقر للتنقل',fr:'CLIQUEZ POUR NAVIGUER',es:'HAGA CLIC PARA NAVEGAR',nl:'KLIK OM TE NAVIGEREN',zh:'点击导航',hi:'नेविगेट करने के लिए क्लिक करें'},
action_centre:        {en:'ACTION CENTRE',ar:'مركز العمل',fr:'CENTRE D\'ACTION',es:'CENTRO DE ACCIÓN',nl:'ACTIECENTRUM',zh:'行动中心',hi:'कार्य केंद्र'},
priority_items:       {en:'PRIORITY ITEMS',ar:'عناصر الأولوية',fr:'ÉLÉMENTS PRIORITAIRES',es:'ELEMENTOS PRIORITARIOS',nl:'PRIORITEITSITEMS',zh:'优先项目',hi:'प्राथमिकता वाली वस्तुएं'},
command_index:        {en:'COMMAND INDEX',ar:'فهرس الأوامر',fr:'INDEX DES COMMANDES',es:'ÍNDICE DE COMANDOS',nl:'OPDRACHTINDEX',zh:'命令索引',hi:'कमांड इंडेक्स'},
module_portals:       {en:'18 SOVEREIGN MODULE PORTALS',ar:'18 بوابة وحدة سيادية',fr:'18 PORTAILS DE MODULE SOUVERAIN',es:'18 PORTALES DE MÓDULOS SOBERANOS',nl:'18 SOEVEREINE MODULEPORTALEN',zh:'18个主权模块门户',hi:'18 संप्रभु मॉड्यूल पोर्टल'},

/* ── PERSONAL LAYER ── */
personal_os:          {en:'Personal OS',ar:'نظام التشغيل الشخصي',fr:'Système d\'exploitation personnel',es:'Sistema operativo personal',nl:'Persoonlijk besturingssysteem',zh:'个人操作系统',hi:'व्यक्तिगत ओएस'},
sovereign_self_system:{en:'Sovereign Self System',ar:'نظام الذات السيادية',fr:'Système du Soi Souverain',es:'Sistema del Yo Soberano',nl:'Soeverein zelf systeem',zh:'主权自我系统',hi:'संप्रभु स्वयं प्रणाली'},
live_from_device:     {en:'LIVE FROM DEVICE',ar:'مباشر من الجهاز',fr:'EN DIRECT DE L\'APPAREIL',es:'EN DIRECTO DESDE DISPOSITIVO',nl:'LIVE VAN APPARAAT',zh:'从设备实时',hi:'डिवाइस से लाइव'},
journal_entries:      {en:'JOURNAL ENTRIES',ar:'مدخلات اليوميات',fr:'ENTRÉES DE JOURNAL',es:'ENTRADAS DE DIARIO',nl:'JOURNAALVERMELDINGEN',zh:'日记条目',hi:'जर्नल प्रविष्टियां'},
gratitude_streak:     {en:'GRATITUDE STREAK',ar:'سلسلة الامتنان',fr:'SÉRIE DE GRATITUDE',es:'RACHA DE GRATITUD',nl:'DANKBAARHEIDREEKS',zh:'感谢连胜',hi:'कृतज्ञता की लकीर'},
cards_due_today:      {en:'CARDS DUE TODAY',ar:'الطاقات المستحقة اليوم',fr:'CARTES À RÉVISER AUJOURD\'HUI',es:'TARJETAS A REVISAR HOY',nl:'KAARTEN VANDAAG DUE',zh:'今日应复习卡片',hi:'आज नियत कार्ड'},
vision_score_avg:     {en:'VISION SCORE AVG',ar:'متوسط درجة الرؤية',fr:'MOY. SCORE DE VISION',es:'PROM. PUNTUACIÓN DE VISIÓN',nl:'GEM. VISIESCORESCORE',zh:'视力评分平均',hi:'दृष्टि स्कोर औसत'},
savings_rate:         {en:'SAVINGS RATE',ar:'معدل الادخار',fr:'TAUX D\'ÉPARGNE',es:'TASA DE AHORRO',nl:'SPAARQUOTE',zh:'储蓄率',hi:'बचत दर'},
contacts_due:         {en:'CONTACTS DUE',ar:'جهات الاتصال المستحقة',fr:'CONTACTS À CONTACTER',es:'CONTACTOS VENCIDOS',nl:'CONTACTEN VENCIDO',zh:'应联系的联系人',hi:'नियत संपर्क'},
need_touchpoint:      {en:'NEED TOUCHPOINT',ar:'بحاجة إلى نقطة اتصال',fr:'BESOIN DE CONTACT',es:'NECESITA PUNTO DE CONTACTO',nl:'BEHOEFTE AAN CONTACTPUNT',zh:'需要接触点',hi:'टचपॉइंट की आवश्यकता'},
open_decisions:       {en:'OPEN DECISIONS',ar:'القرارات المفتوحة',fr:'DÉCISIONS OUVERTES',es:'DECISIONES ABIERTAS',nl:'OPENSTAANDE BESLUITEN',zh:'开放决定',hi:'खुली निर्णय'},
awaiting_commit:      {en:'AWAITING COMMIT',ar:'في انتظار الالتزام',fr:'EN ATTENTE D\'ENGAGEMENT',es:'EN ESPERA DE COMPROMISO',nl:'WACHTEN OP TOEZEGGING',zh:'等待承诺',hi:'प्रतिबद्धता की प्रतीक्षा'},
body_weight:          {en:'BODY WEIGHT',ar:'وزن الجسم',fr:'POIDS CORPOREL',es:'PESO CORPORAL',nl:'LICHAAMSGEWICHT',zh:'身体体重',hi:'शरीर का वजन'},
kg_last_log:          {en:'KG, LAST LOG',ar:'كجم، آخر سجل',fr:'KG, DERNIER ENREGISTREMENT',es:'KG, ÚLTIMO REGISTRO',nl:'KG, LAATSTE LOGBOEK',zh:'公斤，最后记录',hi:'किग्रा, अंतिम लॉग'},

/* ── LIFE WHEEL ── */
life_wheel:           {en:'Life Wheel',ar:'عجلة الحياة',fr:'Roue de la vie',es:'Rueda de la vida',nl:'Levenswiel',zh:'生活之轮',hi:'जीवन चक्र'},
eight_domains:        {en:'Eight Domains',ar:'المجالات الثمانية',fr:'Huit domaines',es:'Ocho dominios',nl:'Acht domeinen',zh:'八个领域',hi:'आठ क्षेत्र'},
full_view:            {en:'FULL VIEW',ar:'العرض الكامل',fr:'VUE COMPLÈTE',es:'VISTA COMPLETA',nl:'VOLLEDIG OVERZICHT',zh:'完整查看',hi:'पूर्ण दृश्य'},

/* ── QUICK ACTIONS ── */
todays_quick_actions: {en:'TODAY\'S QUICK ACTIONS',ar:'الإجراءات السريعة لليوم',fr:'ACTIONS RAPIDES D\'AUJOURD\'HUI',es:'ACCIONES RÁPIDAS DE HOY',nl:'SNELACTIES VAN VANDAAG',zh:'今日快速操作',hi:'आज की त्वरित कार्रवाई'},
write_in_journal:     {en:'Write in Journal',ar:'اكتب في اليوميات',fr:'Écrire dans le journal',es:'Escribir en el diario',nl:'In dagboek schrijven',zh:'写入日记',hi:'जर्नल में लिखें'},
encrypted_private:    {en:'Encrypted, Private',ar:'مشفر، خاص',fr:'Chiffré, privé',es:'Cifrado, privado',nl:'Versleuteld, privé',zh:'加密，私密',hi:'एन्क्रिप्टेड, निजी'},
log_gratitude:        {en:'Log Gratitude',ar:'سجل الامتنان',fr:'Enregistrer la gratitude',es:'Registrar gratitud',nl:'Dankbaarheid registreren',zh:'记录感谢',hi:'कृतज्ञता दर्ज करें'},
three_things:         {en:'Three Good Things',ar:'ثلاثة أشياء جيدة',fr:'Trois bonnes choses',es:'Tres cosas buenas',nl:'Drie goede dingen',zh:'三件好事',hi:'तीन अच्छी चीजें'},
study_flashcards:     {en:'Study Flashcards',ar:'ادرس البطاقات التعليمية',fr:'Étudier les flashcards',es:'Estudiar fichas',nl:'Flitskaarten bestuderen',zh:'学习闪卡',hi:'फ्लैशकार्ड का अध्ययन करें'},
sm2_spaced_repetition:{en:'SM2 Spaced Repetition',ar:'تكرار SM2 المتباعد',fr:'Répétition espacée SM2',es:'Repetición espaciada SM2',nl:'SM2 Spaced Repetition',zh:'SM2间隔重复',hi:'एसएम2 रिक्त दोहराव'},
log_body_stats:       {en:'Log Body Stats',ar:'سجل إحصائيات الجسم',fr:'Enregistrer les statistiques corporelles',es:'Registrar estadísticas corporales',nl:'Lichaamsstats registreren',zh:'记录身体统计',hi:'शरीर के आँकड़े दर्ज करें'},
weight_bf_measurements:{en:'Weight & BF Measurements',ar:'قياسات الوزن والدهون',fr:'Mesures de poids et %BF',es:'Medidas de peso y %BF',nl:'Gewichts- en vetmetingen',zh:'体重和体脂测量',hi:'वजन और वसा माप'},
track_budget:         {en:'Track Budget',ar:'تتبع الميزانية',fr:'Suivre le budget',es:'Seguimiento del presupuesto',nl:'Budget bijhouden',zh:'追踪预算',hi:'बजट ट्रैक करें'},
monthly_overview:     {en:'Monthly Overview',ar:'نظرة عامة شهرية',fr:'Aperçu mensuel',es:'Descripción general mensual',nl:'Maandelijks overzicht',zh:'每月概览',hi:'मासिक अवलोकन'},
decision_journal:     {en:'Decision Journal',ar:'يوميات القرارات',fr:'Journal des décisions',es:'Diario de decisiones',nl:'Besluitenlogboek',zh:'决定日记',hi:'निर्णय जर्नल'},
frameworks_bias_guard:{en:'Frameworks & Bias Guard',ar:'الأطر وحماية التحيز',fr:'Cadres et protection contre les biais',es:'Marcos y protección contra sesgos',nl:'Frameworks en voorkeursbescherming',zh:'框架和偏见防护',hi:'ढांचे और पूर्वाग्रह संरक्षण'},

/* ── GENERAL UI ── */
loading:              {en:'Loading',ar:'جاري التحميل',fr:'Chargement',es:'Cargando',nl:'Laden',zh:'加载中',hi:'लोड हो रहा है'},
refresh:              {en:'Refresh',ar:'تحديث',fr:'Actualiser',es:'Actualizar',nl:'Vernieuwen',zh:'刷新',hi:'ताज़ा करें'},
save:                 {en:'Save',ar:'حفظ',fr:'Sauvegarder',es:'Guardar',nl:'Opslaan',zh:'保存',hi:'सहेजें'},
cancel:               {en:'Cancel',ar:'إلغاء',fr:'Annuler',es:'Cancelar',nl:'Annuleren',zh:'取消',hi:'रद्द करें'},
submit:               {en:'Submit',ar:'إرسال',fr:'Soumettre',es:'Enviar',nl:'Indienen',zh:'提交',hi:'जमा करें'},
search:               {en:'Search',ar:'بحث',fr:'Rechercher',es:'Buscar',nl:'Zoeken',zh:'搜索',hi:'खोज'},
private:              {en:'Private',ar:'خاص',fr:'Privé',es:'Privado',nl:'Privé',zh:'私密',hi:'निजी'},
public:               {en:'Public',ar:'عام',fr:'Public',es:'Público',nl:'Openbaar',zh:'公开',hi:'सार्वजनिक'},
close:                {en:'Close',ar:'إغلاق',fr:'Fermer',es:'Cerrar',nl:'Sluiten',zh:'关闭',hi:'बंद करें'},
more:                 {en:'Learn More',ar:'اعرف المزيد',fr:'En savoir plus',es:'Saber más',nl:'Meer info',zh:'了解更多',hi:'और जानें'},
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

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

/* ── PROFILE ── */
prof_tab_identity:    {en:'Identity',ar:'الهوية',fr:'Identité',es:'Identidad',nl:'Identiteit',zh:'身份',hi:'पहचान'},
prof_tab_passport:    {en:'Passport',ar:'جواز السفر',fr:'Passeport',es:'Pasaporte',nl:'Paspoort',zh:'护照',hi:'पासपोर्ट'},
prof_tab_science:     {en:'Science',ar:'العلم',fr:'Science',es:'Ciencia',nl:'Wetenschap',zh:'科学',hi:'विज्ञान'},
prof_kpi_matrix_coord:{en:'Matrix Coord',ar:'إحداثي المصفوفة',fr:'Coordonnées Matrix',es:'Coordenada de Matriz',nl:'Matrix Coördinaat',zh:'矩阵坐标',hi:'मैट्रिक्स निर्देशांक'},
prof_kpi_material_tier:{en:'Material Tier',ar:'مستوى المادة',fr:'Tier Matériel',es:'Nivel de Material',nl:'Materiële Laag',zh:'材料层级',hi:'भौतिक स्तर'},
prof_kpi_grade:       {en:'Grade',ar:'الدرجة',fr:'Note',es:'Calificación',nl:'Beoordeling',zh:'成绩',hi:'ग्रेड'},
prof_label_full_name: {en:'Full Name',ar:'الاسم الكامل',fr:'Nom complet',es:'Nombre completo',nl:'Volledige naam',zh:'全名',hi:'पूरा नाम'},
prof_label_father_name:{en:'Father\'s Name',ar:'اسم الأب',fr:'Nom du père',es:'Nombre del padre',nl:'Vaders naam',zh:'父亲的名字',hi:'पिता का नाम'},
prof_label_mother_name:{en:'Mother\'s Name',ar:'اسم الأم',fr:'Nom de la mère',es:'Nombre de la madre',nl:'Moeders naam',zh:'母亲的名字',hi:'माता का नाम'},
prof_label_dob:       {en:'Date of Birth',ar:'تاريخ الميلاد',fr:'Date de naissance',es:'Fecha de nacimiento',nl:'Geboortedatum',zh:'出生日期',hi:'जन्म तिथि'},
prof_label_place_birth:{en:'Place of Birth',ar:'مكان الولادة',fr:'Lieu de naissance',es:'Lugar de nacimiento',nl:'Geboorteplaats',zh:'出生地点',hi:'जन्म स्थान'},
prof_label_nationality:{en:'Nationality',ar:'الجنسية',fr:'Nationalité',es:'Nacionalidad',nl:'Nationaliteit',zh:'国籍',hi:'राष्ट्रीयता'},
prof_label_blood_type:{en:'Blood Type',ar:'فصيلة الدم',fr:'Groupe sanguin',es:'Tipo de sangre',nl:'Bloedgroep',zh:'血型',hi:'रक्त प्रकार'},
prof_label_registry:  {en:'Registry',ar:'السجل',fr:'Registre',es:'Registro',nl:'Register',zh:'登记簿',hi:'रजिस्ट्री'},
prof_label_region:    {en:'Region',ar:'المنطقة',fr:'Région',es:'Región',nl:'Regio',zh:'地区',hi:'क्षेत्र'},
prof_label_agent_assigned:{en:'Agent Assigned',ar:'الوكيل المعين',fr:'Agent assigné',es:'Agente asignado',nl:'Toegewezen agent',zh:'分配的代理',hi:'निर्धारित एजेंट'},
prof_label_sovereign_token:{en:'Sovereign Token',ar:'الرمز السيادي',fr:'Jeton souverain',es:'Token soberano',nl:'Soeverein token',zh:'主权令牌',hi:'संप्रभु टोकन'},
prof_label_axis_a:    {en:'Axis A',ar:'المحور أ',fr:'Axe A',es:'Eje A',nl:'As A',zh:'轴 A',hi:'अक्ष ए'},
prof_label_axis_b:    {en:'Axis B',ar:'المحور ب',fr:'Axe B',es:'Eje B',nl:'As B',zh:'轴 B',hi:'अक्ष बी'},
prof_label_axis_c:    {en:'Axis C',ar:'المحور ج',fr:'Axe C',es:'Eje C',nl:'As C',zh:'轴 C',hi:'अक्ष सी'},
prof_portfolio_investment:{en:'Investment Engine',ar:'محرك الاستثمار',fr:'Moteur d\'investissement',es:'Motor de inversión',nl:'Investeringsmotor',zh:'投资引擎',hi:'निवेश इंजन'},
prof_portfolio_total_value:{en:'Total Value',ar:'القيمة الإجمالية',fr:'Valeur totale',es:'Valor total',nl:'Totale waarde',zh:'总值',hi:'कुल मूल्य'},
prof_portfolio_token_supply:{en:'Token Supply',ar:'إمداد الرموز',fr:'Approvisionnement en jetons',es:'Suministro de tokens',nl:'Token aanbod',zh:'代币供应',hi:'टोकन आपूर्ति'},
prof_portfolio_physical:{en:'Physical Assets',ar:'الأصول المادية',fr:'Actifs physiques',es:'Activos físicos',nl:'Fysieke activa',zh:'物理资产',hi:'भौतिक संपत्ति'},
prof_portfolio_matrix:{en:'Matrix Assets',ar:'أصول المصفوفة',fr:'Actifs Matrix',es:'Activos de Matriz',nl:'Matrix-activa',zh:'矩阵资产',hi:'मैट्रिक्स संपत्ति'},
prof_portfolio_performance:{en:'Performance',ar:'الأداء',fr:'Performance',es:'Rendimiento',nl:'Prestatie',zh:'性能',hi:'प्रदर्शन'},
prof_portfolio_holdings:{en:'Holdings',ar:'الممتلكات',fr:'Portefeuille',es:'Tenencias',nl:'Bezittingen',zh:'持仓',hi:'पकड़'},
prof_portfolio_allocation:{en:'Allocation',ar:'التخصيص',fr:'Allocation',es:'Asignación',nl:'Allocatie',zh:'配置',hi:'आवंटन'},
prof_portfolio_12_tokens:{en:'12 Tokens',ar:'12 رمزًا',fr:'12 jetons',es:'12 tokens',nl:'12 tokens',zh:'12 个代币',hi:'12 टोकन'},
prof_portfolio_position:{en:'Position',ar:'المركز',fr:'Position',es:'Posición',nl:'Positie',zh:'持仓',hi:'स्थिति'},
prof_portfolio_transactions:{en:'Transactions',ar:'المعاملات',fr:'Transactions',es:'Transacciones',nl:'Transacties',zh:'交易',hi:'लेनदेन'},
prof_portfolio_reports:{en:'Reports',ar:'التقارير',fr:'Rapports',es:'Reportes',nl:'Rapporten',zh:'报告',hi:'रिपोर्ट'},
prof_portfolio_engine:{en:'Engine Details',ar:'تفاصيل المحرك',fr:'Détails du moteur',es:'Detalles del motor',nl:'Motordetails',zh:'引擎详情',hi:'इंजन विवरण'},
prof_passport_sovereign:{en:'Sovereign Passport',ar:'جواز السفر السيادي',fr:'Passeport souverain',es:'Pasaporte soberano',nl:'Soeverein paspoort',zh:'主权护照',hi:'संप्रभु पासपोर्ट'},
prof_label_rank:      {en:'Rank',ar:'الرتبة',fr:'Rang',es:'Rango',nl:'Rang',zh:'排名',hi:'रैंक'},
prof_label_faction:   {en:'Faction',ar:'الفصيل',fr:'Faction',es:'Facción',nl:'Factie',zh:'派系',hi:'गुट'},
prof_label_node:      {en:'Node',ar:'العقدة',fr:'Nœud',es:'Nodo',nl:'Knooppunt',zh:'节点',hi:'नोड'},
prof_label_sovereignty_id:{en:'Sovereignty ID',ar:'معرف السيادة',fr:'ID Souveraineté',es:'ID de Soberanía',nl:'Soevereiniteid-ID',zh:'主权ID',hi:'संप्रभुता ID'},
prof_kyc_verification:{en:'KYC Verification',ar:'التحقق من KYC',fr:'Vérification KYC',es:'Verificación KYC',nl:'KYC-verificatie',zh:'KYC验证',hi:'केवाईसी सत्यापन'},
prof_kyc_status:      {en:'Verification Status',ar:'حالة التحقق',fr:'Statut de vérification',es:'Estado de verificación',nl:'Verificatiestatus',zh:'验证状态',hi:'सत्यापन स्थिति'},
prof_kyc_steps:       {en:'Required Steps',ar:'الخطوات المطلوبة',fr:'Étapes requises',es:'Pasos requeridos',nl:'Vereiste stappen',zh:'所需步骤',hi:'आवश्यक कदम'},
prof_kyc_document:    {en:'Upload Document',ar:'تحميل المستند',fr:'Télécharger le document',es:'Cargar documento',nl:'Document uploaden',zh:'上传文档',hi:'दस्तावेज़ अपलोड करें'},
prof_kyc_security:    {en:'Security Level',ar:'مستوى الأمان',fr:'Niveau de sécurité',es:'Nivel de seguridad',nl:'Beveiligingsniveau',zh:'安全级别',hi:'सुरक्षा स्तर'},
prof_kyc_unlocks:     {en:'Unlocks Access To',ar:'فتح الوصول إلى',fr:'Déverrouille l\'accès à',es:'Desbloquea acceso a',nl:'Ontgrendelt toegang tot',zh:'解锁访问',hi:'तक पहुंच अनलॉक करता है'},
prof_character_sovereign:{en:'Sovereign Character',ar:'شخصية سيادية',fr:'Caractère souverain',es:'Carácter soberano',nl:'Soeverein karakter',zh:'主权人物',hi:'संप्रभु चरित्र'},
prof_character_evolution:{en:'Character Evolution',ar:'تطور الشخصية',fr:'Évolution du caractère',es:'Evolución del carácter',nl:'Karakterontwikkeling',zh:'角色演进',hi:'चरित्र विकास'},
prof_character_archetypes:{en:'Archetypes',ar:'النماذج الأصلية',fr:'Archétypes',es:'Arquetipos',nl:'Archetypen',zh:'原型',hi:'प्रोटोटाइप'},
prof_character_genealogy:{en:'Genealogy',ar:'علم الأنساب',fr:'Généalogie',es:'Genealogía',nl:'Genealogie',zh:'族谱',hi:'वंशावली'},
prof_character_inheritance:{en:'Inheritance',ar:'الوراثة',fr:'Héritage',es:'Herencia',nl:'Erfenis',zh:'继承',hi:'विरासत'},
prof_label_character_name:{en:'Character Name',ar:'اسم الشخصية',fr:'Nom du personnage',es:'Nombre del personaje',nl:'Karakternaam',zh:'角色名称',hi:'पात्र का नाम'},
prof_label_dominant_trait:{en:'Dominant Trait',ar:'السمة السائدة',fr:'Trait dominant',es:'Rasgo dominante',nl:'Dominante eigenschap',zh:'主导特征',hi:'प्रमुख विशेषता'},
prof_label_inheritance_mode:{en:'Inheritance Mode',ar:'وضع الوراثة',fr:'Mode d\'héritage',es:'Modo de herencia',nl:'Ervenismodus',zh:'继承模式',hi:'विरासत मोड'},
prof_label_legacy_statement:{en:'Legacy Statement',ar:'بيان الإرث',fr:'Déclaration d\'héritage',es:'Declaración de legado',nl:'Erfenisverklaring',zh:'遗产声明',hi:'विरासत विवरण'},
prof_character_seal:  {en:'Character Seal',ar:'ختم الشخصية',fr:'Sceau du personnage',es:'Sello del personaje',nl:'Karakterzegel',zh:'角色印章',hi:'चरित्र मुहर'},
prof_science_formula: {en:'Authority Formula',ar:'صيغة السلطة',fr:'Formule d\'autorité',es:'Fórmula de autoridad',nl:'Autoriteitsformule',zh:'权力公式',hi:'प्राधिकार सूत्र'},
prof_science_constants:{en:'Constants',ar:'الثوابت',fr:'Constantes',es:'Constantes',nl:'Constanten',zh:'常数',hi:'स्थिरांक'},
prof_science_gates:   {en:'Gates & Thresholds',ar:'البوابات والعتبات',fr:'Portes et seuils',es:'Puertas y umbrales',nl:'Poorten en drempels',zh:'门限和阈值',hi:'गेट्स और थ्रेशोल्ड'},
prof_gate_sand:       {en:'Sand Gate',ar:'بوابة الرمل',fr:'Porte du sable',es:'Puerta de arena',nl:'Zandpoort',zh:'沙门',hi:'रेत द्वार'},
prof_gate_fire:       {en:'Fire Gate',ar:'بوابة النار',fr:'Porte du feu',es:'Puerta de fuego',nl:'Vuurpoort',zh:'火门',hi:'आग द्वार'},
prof_gate_wind:       {en:'Wind Gate',ar:'بوابة الريح',fr:'Porte du vent',es:'Puerta del viento',nl:'Windpoort',zh:'风门',hi:'पवन द्वार'},
prof_gate_metal:      {en:'Metal Gate',ar:'بوابة المعادن',fr:'Porte du métal',es:'Puerta de metal',nl:'Metaalpoort',zh:'金属门',hi:'धातु द्वार'},
prof_gate_water:      {en:'Water Gate',ar:'بوابة المياه',fr:'Porte de l\'eau',es:'Puerta del agua',nl:'Waterpoort',zh:'水门',hi:'जल द्वार'},
prof_gate_soul:       {en:'Soul Gate',ar:'بوابة الروح',fr:'Porte de l\'âme',es:'Puerta del alma',nl:'Zielspoort',zh:'灵魂之门',hi:'आत्मा द्वार'},
prof_gate_void:       {en:'Void Gate',ar:'بوابة الفراغ',fr:'Porte du vide',es:'Puerta del vacío',nl:'Leegte-poort',zh:'虚空之门',hi:'शून्य द्वार'},
prof_gate_sight:      {en:'Sight Gate',ar:'بوابة الرؤية',fr:'Porte de la vision',es:'Puerta de la vista',nl:'Zichtpoort',zh:'视觉之门',hi:'दृष्टि द्वार'},
prof_gate_theall:     {en:'TheAll Gate',ar:'بوابة الكل',fr:'Porte du Tout',es:'Puerta del Todo',nl:'Al-Poort',zh:'全一之门',hi:'समस्त द्वार'},
prof_gate_omega:      {en:'Omega Gate',ar:'بوابة أوميغا',fr:'Porte Oméga',es:'Puerta Omega',nl:'Omegapoort',zh:'欧米伽之门',hi:'ओमेगा द्वार'},
prof_arch_console:    {en:'Architecture Console',ar:'وحدة التحكم المعمارية',fr:'Console d\'architecture',es:'Consola de arquitectura',nl:'Architectuurconsole',zh:'架构控制台',hi:'आर्किटेक्चर कंसोल'},
prof_approval_queue:  {en:'Approval Queue',ar:'قائمة الموافقة',fr:'File d\'approbation',es:'Cola de aprobación',nl:'Goedkeuringswachtrij',zh:'批准队列',hi:'अनुमोदन कतार'},
prof_matrix_engine:   {en:'Matrix Engine',ar:'محرك المصفوفة',fr:'Moteur de matrice',es:'Motor de matriz',nl:'Matrixmotor',zh:'矩阵引擎',hi:'मैट्रिक्स इंजन'},
prof_advertising:     {en:'Advertising',ar:'الإعلان',fr:'Publicité',es:'Publicidad',nl:'Adverteren',zh:'广告',hi:'विज्ञापन'},
prof_sovereign_apex:  {en:'Sovereign Apex',ar:'قمة السيادة',fr:'Apex souverain',es:'Ápex soberano',nl:'Soevereine top',zh:'主权顶点',hi:'संप्रभु शिखर'},
prof_members_waiting: {en:'Members Waiting',ar:'أعضاء ينتظرون',fr:'Membres en attente',es:'Miembros esperando',nl:'Wachtende leden',zh:'等待中的成员',hi:'प्रतीक्षा में सदस्य'},
prof_access_requests: {en:'Access Requests',ar:'طلبات الوصول',fr:'Demandes d\'accès',es:'Solicitudes de acceso',nl:'Toegangsaanvragen',zh:'访问请求',hi:'अभिगम अनुरोध'},
prof_trial_duration:  {en:'Trial Duration',ar:'مدة المحاولة',fr:'Durée du procès',es:'Duración del ensayo',nl:'Proefperiode',zh:'试用期限',hi:'परीक्षण अवधि'},
prof_all_members:     {en:'All Members',ar:'جميع الأعضاء',fr:'Tous les membres',es:'Todos los miembros',nl:'Alle leden',zh:'所有成员',hi:'सभी सदस्य'},

/* ── DASHBOARD SECTIONS ── */
dash_activity_heatmap:{en:'SOVEREIGN ACTIVITY · 90-DAY CONTRIBUTION HEATMAP',ar:'النشاط السيادي · خريطة حرارية للمساهمة لمدة 90 يومًا',fr:'ACTIVITÉ SOUVERAINE · CARTE THERMIQUE DE CONTRIBUTION 90 JOURS',es:'ACTIVIDAD SOBERANA · MAPA DE CALOR DE CONTRIBUCIÓN DE 90 DÍAS',nl:'SOEVEREINE ACTIVITEIT · 90-DAAGSE BIJDRAGENHEATMAP',zh:'主权活动·90天贡献热力图',hi:'संप्रभु गतिविधि·90 दिन का योगदान हीटमैप'},
dash_personal_tools:  {en:'PERSONAL SOVEREIGN TOOLS · ALL 8 MODULES',ar:'أدوات سيادية شخصية · جميع 8 وحدات',fr:'OUTILS SOUVERAINS PERSONNELS · TOUS LES 8 MODULES',es:'HERRAMIENTAS SOBERANAS PERSONALES · LOS 8 MÓDULOS',nl:'PERSOONLIJKE SOEVEREINE TOOLS · ALLE 8 MODULES',zh:'个人主权工具·全部8个模块',hi:'व्यक्तिगत संप्रभु उपकरण·सभी 8 मॉड्यूल'},
dash_platform_index:  {en:'PLATFORM COMMAND INDEX · ALL 170 PAGES · 15 SECTIONS',ar:'فهرس أوامر المنصة · 170 صفحة · 15 قسم',fr:'INDEX DE COMMANDE DE PLATEFORME · 170 PAGES · 15 SECTIONS',es:'ÍNDICE DE COMANDOS DE PLATAFORMA · 170 PÁGINAS · 15 SECCIONES',nl:'PLATFORMOPDRACHT INDEX · 170 PAGINA\'S · 15 SECTIES',zh:'平台命令索引·170页·15个部分',hi:'प्लेटफॉर्म आदेश सूचकांक·170 पृष्ठ·15 अनुभाग'},
dash_ecosystem_map:   {en:'ECOSYSTEM MAP',ar:'خريطة النظام البيئي',fr:'CARTE DE L\'ÉCOSYSTÈME',es:'MAPA DEL ECOSISTEMA',nl:'ECOSYSTEEMKAART',zh:'生态系统地图',hi:'पारिस्थितिकी तंत्र मानचित्र'},
dash_intelligence_engine:{en:'INTELLIGENCE ENGINE · ANALYTICS · RADAR · AI QUERY',ar:'محرك الذكاء · التحليلات · الرادار · استعلام الذكاء الاصطناعي',fr:'MOTEUR D\'INTELLIGENCE · ANALYTIQUE · RADAR · REQUÊTE IA',es:'MOTOR DE INTELIGENCIA · ANÁLISIS · RADAR · CONSULTA IA',nl:'INTELLIGENTIEMOTOR · ANALYSES · RADAR · AI-QUERY',zh:'智能引擎·分析·雷达·人工智能查询',hi:'बुद्धिमत्ता इंजन·विश्लेषण·रडार·एआई क्वेरी'},
dash_axis_radar:      {en:'AXIS PROGRESSION RADAR',ar:'رادار تقدم المحور',fr:'RADAR DE PROGRESSION DES AXES',es:'RADAR DE PROGRESIÓN DE EJES',nl:'AS PROGRESSIE RADAR',zh:'轴线进展雷达',hi:'अक्ष प्रगति रडार'},
dash_full_analytics:  {en:'FULL ANALYTICS',ar:'التحليلات الكاملة',fr:'ANALYTIQUE COMPLÈTE',es:'ANÁLISIS COMPLETO',nl:'VOLLEDIGE ANALYTIEK',zh:'完整分析',hi:'पूर्ण विश्लेषण'},
dash_sovereign_intelligence:{en:'SOVEREIGN INTELLIGENCE · DIRECT QUERY',ar:'الذكاء السيادي · الاستعلام المباشر',fr:'INTELLIGENCE SOUVERAINE · REQUÊTE DIRECTE',es:'INTELIGENCIA SOBERANA · CONSULTA DIRECTA',nl:'SOEVEREINE INLICHTINGEN · DIRECT QUERY',zh:'主权智能·直接查询',hi:'संप्रभु बुद्धिमत्ता·सीधी क्वेरी'},
dash_top_pages:       {en:'TOP PAGES · SESSION DISTRIBUTION',ar:'أفضل الصفحات · توزيع الجلسة',fr:'PAGES PRINCIPALES · DISTRIBUTION DES SESSIONS',es:'PÁGINAS PRINCIPALES · DISTRIBUCIÓN DE SESIONES',nl:'TOPPAGIN\'S · SESSIEVERDELINGS',zh:'热门页面·会话分布',hi:'शीर्ष पृष्ठ·सत्र वितरण'},
dash_sovereign_command:{en:'SOVEREIGN COMMAND · OPERATIONS · AGENTS · ADMINISTRATION',ar:'القيادة السيادية · العمليات · الوكلاء · الإدارة',fr:'COMMANDE SOUVERAINE · OPÉRATIONS · AGENTS · ADMINISTRATION',es:'COMANDO SOBERANO · OPERACIONES · AGENTES · ADMINISTRACIÓN',nl:'SOEVEREIN COMMANDO · OPERATIES · AGENTEN · ADMINISTRATIE',zh:'主权命令·运营·代理·管理',hi:'संप्रभु आदेश·संचालन·एजेंट·प्रशासन'},
dash_active_workflows:{en:'ACTIVE WORKFLOWS',ar:'سير العمل النشطة',fr:'FLUX DE TRAVAIL ACTIFS',es:'FLUJOS DE TRABAJO ACTIVOS',nl:'ACTIEVE WERKSTROMEN',zh:'活跃工作流',hi:'सक्रिय कार्यप्रवाह'},
dash_agent_quick_access:{en:'AGENT QUICK ACCESS',ar:'الوصول السريع للوكيل',fr:'ACCÈS RAPIDE AGENT',es:'ACCESO RÁPIDO A AGENTES',nl:'AGENT SNELLE TOEGANG',zh:'代理快速访问',hi:'एजेंट त्वरित पहुंच'},
dash_full_command:    {en:'FULL COMMAND',ar:'الأمر الكامل',fr:'COMMANDE COMPLÈTE',es:'COMANDO COMPLETO',nl:'VOLLEDIG COMMANDO',zh:'完整命令',hi:'पूर्ण आदेश'},
dash_admin_actions:   {en:'ADMIN ACTIONS · OWNER CONTROLS',ar:'إجراءات المسؤول · عناصر تحكم المالك',fr:'ACTIONS ADMIN · CONTRÔLES PROPRIÉTAIRE',es:'ACCIONES ADMIN · CONTROLES DEL PROPIETARIO',nl:'ADMIN-ACTIES · EIGENAARBESTURINGEN',zh:'管理操作·所有者控制',hi:'प्रशासक कार्य·मालिक नियंत्रण'},
dash_approve_access:  {en:'APPROVE ACCESS REQUESTS',ar:'الموافقة على طلبات الوصول',fr:'APPROUVER LES DEMANDES D\'ACCÈS',es:'APROBAR SOLICITUDES DE ACCESO',nl:'TOEGANGSAANVRAGEN GOEDKEUREN',zh:'批准访问请求',hi:'अभिगम अनुरोधों को मंजूरी दें'},
dash_sre_observatory: {en:'SRE OBSERVATORY',ar:'مرصد SRE',fr:'OBSERVATOIRE SRE',es:'OBSERVATORIO SRE',nl:'SRE OBSERVATORIUM',zh:'SRE观测台',hi:'SRE वेधशाला'},
dash_enterprise_control:{en:'ENTERPRISE CONTROL',ar:'التحكم في المؤسسة',fr:'CONTRÔLE D\'ENTREPRISE',es:'CONTROL EMPRESARIAL',nl:'BEDRIJFSCONTROLE',zh:'企业控制',hi:'एंटरप्राइज नियंत्रण'},
dash_governance_board:{en:'GOVERNANCE BOARD',ar:'مجلس الحوكمة',fr:'CONSEIL DE GOUVERNANCE',es:'JUNTA DE GOBERNANZA',nl:'BESTUURRAAD',zh:'治理委员会',hi:'शासन बोर्ड'},
dash_evolution_roadmap:{en:'EVOLUTION ROADMAP',ar:'خريطة طريق التطور',fr:'FEUILLE DE ROUTE ÉVOLUTION',es:'HOJA DE RUTA DE EVOLUCIÓN',nl:'EVOLUTIE ROADMAP',zh:'演进路线图',hi:'विकास रोडमैप'},
dash_privacy_centre:  {en:'PRIVACY CENTRE',ar:'مركز الخصوصية',fr:'CENTRE DE CONFIDENTIALITÉ',es:'CENTRO DE PRIVACIDAD',nl:'PRIVACYCENTRUM',zh:'隐私中心',hi:'गोपनीयता केंद्र'},

/* ── LEADERBOARD ── */
lead_topbar_title:    {en:'SOVEREIGN LEADERBOARD',ar:'لوحة الترتيب السيادية',fr:'CLASSEMENT SOUVERAIN',es:'TABLA DE CLASIFICACIÓN SOBERANA',nl:'SOEVEREIN RANGLIJST',zh:'主权排行榜',hi:'संप्रभु लीडरबोर्ड'},
lead_tab_ranking:     {en:'RANKING',ar:'الترتيب',fr:'CLASSEMENT',es:'CLASIFICACIÓN',nl:'RANGLIJST',zh:'排名',hi:'रैंकिंग'},
lead_tab_podium:      {en:'PODIUM',ar:'المنصة',fr:'PODIUM',es:'PODIO',nl:'PODIUM',zh:'领奖台',hi:'पोडियम'},
lead_tab_myrank:      {en:'MY RANK',ar:'ترتيبي',fr:'MON RANG',es:'MI RANGO',nl:'MIJN RANG',zh:'我的排名',hi:'मेरी रैंकिंग'},
lead_tab_science:     {en:'SCIENCE',ar:'العلم',fr:'SCIENCE',es:'CIENCIA',nl:'WETENSCHAP',zh:'科学',hi:'विज्ञान'},
lead_ranking_kpi_total:{en:'RANKED MEMBERS',ar:'الأعضاء المصنفون',fr:'MEMBRES CLASSÉS',es:'MIEMBROS CLASIFICADOS',nl:'GECLASSIFICEERDE LEDEN',zh:'排名成员',hi:'रैंक किए गए सदस्य'},
lead_ranking_kpi_myrank:{en:'MY GLOBAL RANK',ar:'ترتيبي العالمي',fr:'MON RANG MONDIAL',es:'MI RANGO GLOBAL',nl:'MIJN MONDIALE RANG',zh:'我的全球排名',hi:'मेरी वैश्विक रैंकिंग'},
lead_ranking_kpi_myauth:{en:'MY AUTHORITY',ar:'سلطتي',fr:'MA AUTORITÉ',es:'MI AUTORIDAD',nl:'MIJN AUTORITEIT',zh:'我的权威',hi:'मेरी प्राधिकार'},
lead_ranking_kpi_freq: {en:'SNAPSHOT FREQUENCY',ar:'تكرار اللقطة',fr:'FRÉQUENCE D\'INSTANTANÉ',es:'FRECUENCIA DE INSTANTÁNEA',nl:'SNAPSHOT FREQUENTIE',zh:'快照频率',hi:'स्नैपशॉट आवृत्ति'},
lead_ranking_section:  {en:'GLOBAL AUTHORITY RANKING · INTEREST-GRAPH WEIGHTED',ar:'الترتيب السلطوي العالمي · موزون بالرسم البياني للمصالح',fr:'CLASSEMENT D\'AUTORITÉ MONDIALE · PONDÉRÉ PAR GRAPHE D\'INTÉRÊT',es:'CLASIFICACIÓN DE AUTORIDAD GLOBAL · PONDERADA POR GRÁFICO DE INTERESES',nl:'MONDIALE AUTORITEITSRANGLIJST · GEWOGEN DOOR INTERESSENGRAFIEK',zh:'全球权威排名 · 利益图加权',hi:'वैश्विक प्राधिकार रैंकिंग · रुचि-ग्राफ भारित'},
lead_table_rank:      {en:'RANK',ar:'الترتيب',fr:'RANG',es:'RANGO',nl:'RANG',zh:'排名',hi:'रैंक'},
lead_table_member:    {en:'MEMBER',ar:'العضو',fr:'MEMBRE',es:'MIEMBRO',nl:'LID',zh:'成员',hi:'सदस्य'},
lead_table_auth:      {en:'AUTHORITY',ar:'السلطة',fr:'AUTORITÉ',es:'AUTORIDAD',nl:'AUTORITEIT',zh:'权威',hi:'प्राधिकार'},
lead_table_axis_a:    {en:'AXIS A',ar:'المحور أ',fr:'AXE A',es:'EJE A',nl:'AS A',zh:'轴 A',hi:'अक्ष ए'},
lead_table_axis_b:    {en:'AXIS B',ar:'المحور ب',fr:'AXE B',es:'EJE B',nl:'AS B',zh:'轴 B',hi:'अक्ष बी'},
lead_table_elem:      {en:'ELEMENT',ar:'العنصر',fr:'ÉLÉMENT',es:'ELEMENTO',nl:'ELEMENT',zh:'元素',hi:'तत्व'},
lead_ranking_methodology:{en:'The Authority Score combines achievement across three axes (Axis A: Contribution, Axis B: Expertise, Axis C: Influence) via √(a³+b³+c³)×φ/e, max 27.8367. Rankings refresh in 30-minute snapshots. Inspired by PageRank, scaled to reward deep specialization.',ar:'يجمع درجة السلطة الإنجاز عبر ثلاثة محاور (المحور أ: المساهمة، المحور ب: الخبرة، المحور ج: التأثير) عبر √(a³+b³+c³)×φ/e، بحد أقصى 27.8367. تتحدث التصنيفات كل 30 دقيقة. مستوحاة من PageRank، مقياس يكافئ التخصص العميق.',fr:'Le Score d\'Autorité combine les réalisations sur trois axes (Axe A : Contribution, Axe B : Expertise, Axe C : Influence) via √(a³+b³+c³)×φ/e, max 27.8367. Les classements se rafraîchissent en instantanés de 30 minutes. Inspiré par PageRank, mis à l\'échelle pour récompenser la spécialisation approfondie.',es:'La Puntuación de Autoridad combina logros en tres ejes (Eje A: Contribución, Eje B: Experiencia, Eje C: Influencia) mediante √(a³+b³+c³)×φ/e, máx 27.8367. Las clasificaciones se actualizan en instantáneas de 30 minutos. Inspirado en PageRank, escalado para recompensar la especialización profunda.',nl:'De Autoriteitscore combineert prestaties over drie assen (As A: Bijdrage, As B: Expertise, As C: Invloed) via √(a³+b³+c³)×φ/e, max 27.8367. Rankings worden elke 30 minuten vernieuwd. Geïnspireerd door PageRank, geschaald om diepe specialisatie te belonen.',zh:'权威分数结合三个轴上的成就（轴A：贡献、轴B：专业知识、轴C：影响力），通过√(a³+b³+c³)×φ/e，最大27.8367。排名每30分钟刷新一次。受PageRank启发，旨在奖励深度专业化。',hi:'प्राधिकार स्कोर तीन अक्षों (अक्ष ए: योगदान, अक्ष बी: विशेषज्ञता, अक्ष सी: प्रभाव) पर उपलब्धि को √(a³+b³+c³)×φ/e के माध्यम से जोड़ता है, अधिकतम 27.8367। रैंकिंग 30-मिनट स्नैपशॉट में ताज़ा होती हैं। PageRank से प्रेरित, गहरे विशेषज्ञता को पुरस्कृत करने के लिए स्केल किया गया।'},
lead_podium_title:    {en:'TOP 3 SOVEREIGN MEMBERS · RANKED BY AUTH',ar:'أفضل 3 أعضاء سيادة · مصنفة حسب السلطة',fr:'TOP 3 MEMBRES SOUVERAINS · CLASSÉS PAR AUTORITÉ',es:'TOP 3 MIEMBROS SOBERANOS · CLASIFICADOS POR AUTORIDAD',nl:'TOP 3 SOEVEREINE LEDEN · GECLASSIFICEERD OP AUTORITEIT',zh:'前三名主权成员 · 按权威排名',hi:'शीर्ष 3 संप्रभु सदस्य · प्राधिकार द्वारा रैंक किए गए'},
lead_podium_auth_label:{en:'AUTHORITY',ar:'السلطة',fr:'AUTORITÉ',es:'AUTORIDAD',nl:'AUTORITEIT',zh:'权威',hi:'प्राधिकार'},
lead_podium_methodology:{en:'Podium Ascendancy',ar:'حكم حكم المسرح',fr:'Prééminence du Podium',es:'Ascendencia del Podio',nl:'Podiumopstijging',zh:'领奖台升华',hi:'पोडियम आरोहण'},
lead_podium_methodology_text:{en:'The top 3 members by this snapshot\'s Authority Score are highlighted here. Membership changes every 30 minutes as members earn and lose points.',ar:'يتم تمييز أفضل 3 أعضاء من خلال درجة السلطة الخاصة بهذه اللقطة هنا. تتغير العضوية كل 30 دقيقة مع كسب الأعضاء وفقدان النقاط.',fr:'Les 3 meilleurs membres selon le Score d\'Autorité de cet instantané sont mis en évidence ici. L\'adhésion change toutes les 30 minutes à mesure que les membres gagnent et perdent des points.',es:'Los 3 principales miembros por la Puntuación de Autoridad de esta instantánea se destacan aquí. La membresía cambia cada 30 minutos cuando los miembros ganan y pierden puntos.',nl:'De top 3 leden op basis van de Autoriteitscore van deze snapshot worden hier weergegeven. Het lidmaatschap verandert elke 30 minuten terwijl leden punten winnen en verliezen.',zh:'本快照权威分数排名前3的成员在此突出显示。随着成员获得和失去积分，成员身份每30分钟更改一次。',hi:'इस स्नैपशॉट के प्राधिकार स्कोर द्वारा शीर्ष 3 सदस्यों को यहां हाइलाइट किया जाता है। जैसे ही सदस्य अंक प्राप्त और खो देते हैं, सदस्यता हर 30 मिनट में बदलती है।'},
lead_myrank_title:    {en:'MY SOVEREIGN STANDING',ar:'وضعي السيادة',fr:'MA POSITION SOUVERAINE',es:'MI POSICIÓN SOBERANA',nl:'MIJN SOEVEREINE POSITIE',zh:'我的主权地位',hi:'मेरी संप्रभु स्थिति'},
lead_myrank_kpi_rank: {en:'GLOBAL RANK',ar:'الترتيب العالمي',fr:'RANG MONDIAL',es:'RANGO GLOBAL',nl:'MONDIALE RANG',zh:'全球排名',hi:'वैश्विक रैंकिंग'},
lead_myrank_kpi_auth: {en:'AUTHORITY SCORE',ar:'درجة السلطة',fr:'SCORE D\'AUTORITÉ',es:'PUNTUACIÓN DE AUTORIDAD',nl:'AUTORITEITSCORE',zh:'权威分数',hi:'प्राधिकार स्कोर'},
lead_myrank_kpi_gate: {en:'GATE LEVEL',ar:'مستوى البوابة',fr:'NIVEAU DE PORTE',es:'NIVEL DE PUERTA',nl:'POORTNIVEAU',zh:'门级别',hi:'गेट स्तर'},
lead_myrank_kpi_total:{en:'TOTAL MEMBERS',ar:'إجمالي الأعضاء',fr:'NOMBRE TOTAL DE MEMBRES',es:'NÚMERO TOTAL DE MIEMBROS',nl:'TOTAAL AANTAL LEDEN',zh:'总成员',hi:'कुल सदस्य'},
lead_myrank_formula_title:{en:'Your Authority Formula',ar:'صيغة سلطتك',fr:'Votre Formule d\'Autorité',es:'Tu Fórmula de Autoridad',nl:'Uw Autoriteitsformule',zh:'你的权威公式',hi:'आपका प्राधिकार सूत्र'},
lead_myrank_formula_text:{en:'Your personal authority score updates in real-time as you earn points across the three axes. Current snapshot: {{snapshot}}.',ar:'يتم تحديث درجة السلطة الشخصية الخاصة بك في الوقت الفعلي أثناء كسب النقاط عبر المحاور الثلاثة. اللقطة الحالية: {{snapshot}}.',fr:'Votre score d\'autorité personnel se met à jour en temps réel au fur et à mesure que vous gagnez des points sur les trois axes. Instantané actuel : {{snapshot}}.',es:'Su puntuación de autoridad personal se actualiza en tiempo real a medida que gana puntos en los tres ejes. Instantánea actual: {{snapshot}}.',nl:'Uw persoonlijke autoriteitscore wordt in real-time bijgewerkt naarmate u punten verdient over de drie assen. Huidige snapshot: {{snapshot}}.',zh:'当您在三个轴上赚取积分时，您的个人权威分数实时更新。当前快照：{{snapshot}}。',hi:'जब आप तीनों अक्षों पर अंक अर्जित करते हैं, तो आपका व्यक्तिगत प्राधिकार स्कोर वास्तविक समय में अपडेट होता है। वर्तमान स्नैपशॉट: {{snapshot}}।'},
lead_science_title:   {en:'LEADERBOARD ARCHITECTURE',ar:'هندسة لوحة الترتيب',fr:'ARCHITECTURE DU CLASSEMENT',es:'ARQUITECTURA DEL TABLERO DE CLASIFICACIÓN',nl:'LEADERBOARD ARCHITECTUUR',zh:'排行榜架构',hi:'लीडरबोर्ड आर्किटेक्चर'},
lead_science_formula_title:{en:'AUTHORITY FORMULA',ar:'صيغة السلطة',fr:'FORMULE D\'AUTORITÉ',es:'FÓRMULA DE AUTORIDAD',nl:'AUTORITEITSFORMULE',zh:'权威公式',hi:'प्राधिकार सूत्र'},
lead_science_formula_body:{en:'√(a³+b³+c³)×φ/e achieves max 27.8367. The cubic root captures non-linear expertise scaling; φ (golden ratio 1.618) and 1/e (≈0.368) fine-tune the final rank. The formula rewards depth.',ar:'√(a³+b³+c³)×φ/e تحقق الحد الأقصى 27.8367. الجذر التكعيبي يلتقط قياس الخبرة غير الخطي؛ φ (النسبة الذهبية 1.618) و1/e (≈0.368) ضبط رقيق في الترتيب النهائي. الصيغة تكافئ العمق.',fr:'√(a³+b³+c³)×φ/e atteint max 27.8367. La racine cubique capture l\'adaptation non linéaire de l\'expertise ; φ (nombre d\'or 1.618) et 1/e (≈0.368) affinent le rang final. La formule récompense la profondeur.',es:'√(a³+b³+c³)×φ/e logra máx 27.8367. La raíz cúbica captura el escalado no lineal de experiencia; φ (proporción áurea 1.618) y 1/e (≈0.368) ajustan el rango final. La fórmula recompensa la profundidad.',nl:'√(a³+b³+c³)×φ/e bereikt max 27.8367. De derdemachtswortel legt niet-lineaire schaling van expertise vast; φ (gulden snede 1.618) en 1/e (≈0.368) verfijnen de eindrangschikking. De formule beloont diepte.',zh:'√(a³+b³+c³)×φ/e 最大达到 27.8367。立方根捕捉非线性专业知识缩放；φ（黄金比例 1.618）和 1/e（≈0.368）微调最终排名。公式奖励深度。',hi:'√(a³+b³+c³)×φ/e अधिकतम 27.8367 प्राप्त करता है। घनमूल गैर-रैखिक विशेषज्ञता स्केलिंग को कैप्चर करता है; φ (सुनहरा अनुपात 1.618) और 1/e (≈0.368) अंतिम रैंक को सूक्ष्म-ट्यून करते हैं। सूत्र गहराई को पुरस्कृत करता है।'},
lead_science_pipeline_title:{en:'RANKING PIPELINE',ar:'خط أنابيب الترتيب',fr:'PIPELINE DE CLASSEMENT',es:'TUBERÍA DE CLASIFICACIÓN',nl:'RANGLIJSTPIJPLIJN',zh:'排名管道',hi:'रैंकिंग पाइपलाइन'},
lead_science_pipeline_body:{en:'Three-tier fallback: live compute per-member authority, cached tier-2 fallback if compute fails, static tier-3 baseline to guarantee availability. Sorted every 30 minutes.',ar:'ثلاثي المستويات الاحتياطي: سلطة الحساب الحي لكل عضو، تخزين مؤقت من المستوى 2 إذا فشل الحساب، خط أساس ثابت من المستوى 3 لضمان التوفر. مصنف كل 30 دقيقة.',fr:'Secours trois niveaux : calcul en direct d\'autorité par membre, secours cache tier-2 en cas d\'échec du calcul, référence statique tier-3 pour garantir la disponibilité. Trié toutes les 30 minutes.',es:'Respaldo de tres niveles: autoridad de cálculo en vivo por miembro, respaldo en caché de nivel 2 si falla el cálculo, línea de base estática de nivel 3 para garantizar disponibilidad. Ordenado cada 30 minutos.',nl:'Drieniveaufallback: live berekening autoriteit per lid, gecached tier-2-fallback als berekening mislukt, statische tier-3-basislijn voor beschikbaarheid. Gesorteerd elke 30 minuten.',zh:'三层备用：实时计算每个成员的权威，如果计算失败则使用缓存的第2层备用，静态第3层基线以保证可用性。每30分钟排序一次。',hi:'तीन-स्तरीय फॉलबैक: लाइव प्रति-सदस्य प्राधिकार गणना, गणना विफल होने पर कैश्ड टियर-2 फॉलबैक, उपलब्धता की गारंटी के लिए स्थिर टियर-3 आधाररेखा। हर 30 मिनट में सॉर्ट किया जाता है।'},
lead_science_cadence_title:{en:'SNAPSHOT CADENCE',ar:'إيقاع اللقطة',fr:'CADENCE D\'INSTANTANÉ',es:'CADENCIA DE INSTANTÁNEA',nl:'SNAPSHOT CADENTIE',zh:'快照节奏',hi:'स्नैपशॉट आवृत्ति'},
lead_science_cadence_body:{en:'Rankings update every 30 minutes. This window balances freshness against computational cost and member experience. Members see consistent results during peak usage without throttling.',ar:'يتم تحديث التصنيفات كل 30 دقيقة. يوازن هذا النافذة بين الانتعاش والتكلفة الحسابية وتجربة الأعضاء. يرى الأعضاء نتائج متسقة أثناء الاستخدام الأقصى دون اختناق.',fr:'Les classements se mettent à jour toutes les 30 minutes. Cette fenêtre équilibre la fraîcheur contre le coût de calcul et l\'expérience des membres. Les membres voient des résultats cohérents lors d\'une utilisation maximale sans limitations.',es:'Las clasificaciones se actualizan cada 30 minutos. Esta ventana equilibra la actualización frente al costo computacional y la experiencia del miembro. Los miembros ven resultados consistentes durante el uso máximo sin limitaciones.',nl:'Rankings worden elke 30 minuten bijgewerkt. Dit venster balanceert versheid tegen rekenkosten en liderservaring. Leden zien consistente resultaten tijdens piekgebruik zonder beperking.',zh:'排名每30分钟更新一次。此窗口在新鲜度与计算成本和成员体验之间取得平衡。成员在高峰使用时看到一致的结果，不会受到限制。',hi:'रैंकिंग हर 30 मिनट में अपडेट होती है। यह विंडो ताज़गी और कम्प्यूटेशनल लागत और सदस्य अनुभव के बीच संतुलन रखता है। सदस्य चरम उपयोग के दौरान बिना थ्रॉटलिंग के सुसंगत परिणाम देखते हैं।'},
lead_science_interest_title:{en:'INTEREST GRAPH',ar:'رسم بياني للمصالح',fr:'GRAPHIQUE D\'INTÉRÊT',es:'GRÁFICO DE INTERÉS',nl:'INTERESSENGRAFIEK',zh:'利益图',hi:'रुचि ग्राफ'},
lead_science_interest_body:{en:'Signals from activity, recommendations, and member follows feed into a real-time graph. Authority scores are adjusted by interest-graph weights: engaged members amplify their communities.',ar:'تتدفق الإشارات من النشاط والتوصيات وتتابع الأعضاء إلى رسم بياني في الوقت الفعلي. يتم تعديل درجات السلطة بواسطة أوزان الرسم البياني للمصالح: يضخم الأعضاء المشاركون مجتمعاتهم.',fr:'Les signaux d\'activité, de recommandations et de suivi des membres alimentent un graphique en temps réel. Les scores d\'autorité sont ajustés par les poids du graphique d\'intérêt : les membres engagés amplifient leurs communautés.',es:'Las señales de actividad, recomendaciones y seguimiento de miembros se alimentan en un gráfico en tiempo real. Los puntajes de autoridad se ajustan por pesos de gráfico de interés: los miembros comprometidos amplifican sus comunidades.',nl:'Signalen van activiteit, aanbevelingen en lidvolgen voeden een grafiek in real-time. Autoriteitscores worden aangepast door geldigheidsgrafiekgewichten: betrokken leden versterken hun gemeenschappen.',zh:'来自活动、推荐和成员关注的信号流入实时图。权威分数通过兴趣图权重进行调整：参与的成员放大他们的社区。',hi:'गतिविधि, सिफारिशों और सदस्य फॉलो से संकेत वास्तविक समय के ग्राफ में प्रवाहित होते हैं। प्राधिकार स्कोर को रुचि-ग्राफ वजन द्वारा समायोजित किया जाता है: व्यस्त सदस्य अपने समुदायों को प्रशस्त करते हैं।'},

/* ── ANALYTICS ── */
ana_topbar_title:     {en:'ANALYTICS',ar:'التحليلات',fr:'ANALYTIQUE',es:'ANÁLISIS',nl:'ANALYTIEK',zh:'分析',hi:'विश्लेषण'},
ana_topbar_subtitle:  {en:'DATA SCIENCE · ML · INTELLIGENCE',ar:'علم البيانات · الذكاء الآلي · الذكاء',fr:'SCIENCE DES DONNÉES · ML · INTELLIGENCE',es:'CIENCIA DE DATOS · ML · INTELIGENCIA',nl:'DATAWETENSCHAPPEN · ML · INTELLIGENTIE',zh:'数据科学 · 机器学习 · 智能',hi:'डेटा विज्ञान · मशीन लर्निंग · बुद्धिमत्ता'},
ana_kpi_authority:    {en:'AUTHORITY',ar:'السلطة',fr:'AUTORITÉ',es:'AUTORIDAD',nl:'AUTORITEIT',zh:'权威',hi:'प्राधिकार'},
ana_kpi_nodes:        {en:'NODES CLEARED',ar:'العقد المحررة',fr:'NŒUDS EFFACÉS',es:'NODOS BORRADOS',nl:'KNOOPPUNTEN GEWIST',zh:'已清除的节点',hi:'साफ किए गए नोड्स'},
ana_kpi_actions:      {en:'VERIFIED ACTIONS',ar:'الإجراءات المعتمدة',fr:'ACTIONS VÉRIFIÉES',es:'ACCIONES VERIFICADAS',nl:'GEVERIFIEERDE ACTIES',zh:'已验证的操作',hi:'सत्यापित क्रियाएं'},
ana_kpi_a3:           {en:'A³ KNOWLEDGE',ar:'معرفة A³',fr:'CONNAISSANCE A³',es:'CONOCIMIENTO A³',nl:'KENNIS A³',zh:'A³ 知识',hi:'A³ ज्ञान'},
ana_kpi_b3:           {en:'B³ MASTERY',ar:'إتقان B³',fr:'MAÎTRISE B³',es:'DOMINIO B³',nl:'BEHEERSING B³',zh:'B³ 掌握',hi:'B³ महारत'},
ana_kpi_c3:           {en:'C³ CONTRIBUTION',ar:'C³ المساهمة',fr:'CONTRIBUTION C³',es:'CONTRIBUCIÓN C³',nl:'BIJDRAGE C³',zh:'C³ 贡献',hi:'C³ योगदान'},
ana_tab_overview:     {en:'OVERVIEW',ar:'نظرة عامة',fr:'APERÇU',es:'DESCRIPCIÓN GENERAL',nl:'OVERZICHT',zh:'概览',hi:'अवलोकन'},
ana_tab_algorithms:   {en:'ALGORITHMS',ar:'الخوارزميات',fr:'ALGORITHMES',es:'ALGORITMOS',nl:'ALGORITMEN',zh:'算法',hi:'एल्गोरिदम'},
ana_tab_data:         {en:'DATA SCIENCE',ar:'علم البيانات',fr:'SCIENCE DES DONNÉES',es:'CIENCIA DE DATOS',nl:'DATAWETENSCHAPPEN',zh:'数据科学',hi:'डेटा विज्ञान'},
ana_tab_science:      {en:'SCIENCE',ar:'العلم',fr:'SCIENCE',es:'CIENCIA',nl:'WETENSCHAP',zh:'科学',hi:'विज्ञान'},
ana_overview_axis:    {en:'AXIS PROGRESSION',ar:'تطور المحور',fr:'PROGRESSION DES AXES',es:'PROGRESIÓN DEL EJE',nl:'ASVOORTGANG',zh:'轴进度',hi:'अक्ष प्रगति'},
ana_overview_authority:{en:'AUTHORITY RADAR',ar:'رادار السلطة',fr:'RADAR D\'AUTORITÉ',es:'RADAR DE AUTORIDAD',nl:'AUTORITEITSRADAR',zh:'权威雷达',hi:'प्राधिकार रडार'},
ana_overview_apex:    {en:'PROGRESS TO APEX',ar:'التقدم نحو الذروة',fr:'PROGRESSION VERS L\'APEX',es:'PROGRESO HACIA EL ÁPICE',nl:'VOORTGANG NAAR APEX',zh:'迈向顶点的进度',hi:'शीर्ष पर प्रगति'},
ana_overview_cube:    {en:'CUBE DISTRIBUTION',ar:'توزيع المكعب',fr:'DISTRIBUTION DU CUBE',es:'DISTRIBUCIÓN DEL CUBO',nl:'KUBUSVERSPREIDING',zh:'立方体分布',hi:'घन वितरण'},
ana_algo_title:       {en:'ALGORITHMS POWERING THE PLATFORM',ar:'الخوارزميات التي تدعم المنصة',fr:'ALGORITHMES ALIMENTANT LA PLATE-FORME',es:'ALGORITMOS QUE IMPULSAN LA PLATAFORMA',nl:'ALGORITMEN DIE HET PLATFORM AANDRIJVEN',zh:'驱动平台的算法',hi:'प्लेटफ़ॉर्म को चलाने वाले एल्गोरिदम'},
ana_algo_dijkstra_title:{en:'DIJKSTRA',ar:'ديجكسترا',fr:'DIJKSTRA',es:'DIJKSTRA',nl:'DIJKSTRA',zh:'迪杰斯特拉',hi:'दिज्क्स्ट्रा'},
ana_algo_dijkstra_sub:{en:'ROUTING OPTIMIZATION · SHORTEST PATH',ar:'تحسين المسار · أقصر مسار',fr:'OPTIMISATION DES ITINÉRAIRES · CHEMIN LE PLUS COURT',es:'OPTIMIZACIÓN DE ENRUTAMIENTO · RUTA MÁS CORTA',nl:'ROUTEOPTIMALISATIE · KORTSTE PAD',zh:'路由优化 · 最短路径',hi:'रूटिंग अनुकूलन · सबसे छोटा रास्ता'},
ana_algo_dijkstra_body:{en:'Matrix progression follows Dijkstra\'s shortest-path algorithm. Each transition takes the optimal route through the 3D knowledge/mastery/contribution space. No backtracking allowed.',ar:'يتبع تقدم المصفوفة خوارزمية ديجكسترا لأقصر مسار. كل انتقال يأخذ المسار الأمثل عبر فضاء المعرفة والإتقان والمساهمة ثلاثي الأبعاد. لا يُسمح بالعودة للخلف.',fr:'La progression de la matrice suit l\'algorithme du plus court chemin de Dijkstra. Chaque transition emprunte l\'itinéraire optimal dans l\'espace 3D connaissance/maîtrise/contribution. Aucun retour en arrière autorisé.',es:'La progresión de la matriz sigue el algoritmo de ruta más corta de Dijkstra. Cada transición toma la ruta óptima a través del espacio 3D conocimiento/maestría/contribución. No se permite retroceso.',nl:'Matrixvoortgang volgt het kortste-pad-algoritme van Dijkstra. Elke overgang neemt de optimale route door de 3D-ruimte kennis/vakkundigheid/bijdrage. Teruggaan niet toegestaan.',zh:'矩阵进度遵循迪杰斯特拉的最短路径算法。每次过渡都是通过3D知识/掌握/贡献空间的最优路线。不允许回溯。',hi:'मैट्रिक्स प्रगति दिज्क्स्ट्रा की सबसे छोटी पथ एल्गोरिदम का अनुसरण करती है। प्रत्येक संक्रमण 3D ज्ञान/महारत/योगदान स्थान के माध्यम से सर्वोत्तम मार्ग लेता है। कोई पिछला हटना अनुमति नहीं है।'},
ana_algo_higgs_title: {en:'HIGGS FIELD',ar:'حقل هيجز',fr:'CHAMP DE HIGGS',es:'CAMPO DE HIGGS',nl:'HIGGS-VELD',zh:'希格斯场',hi:'हिग्स क्षेत्र'},
ana_algo_higgs_sub:   {en:'QUANTUM GATES · AUTHORITY ATTRACTION',ar:'البوابات الكمية · جذب السلطة',fr:'PORTES QUANTIQUES · ATTRACTION D\'AUTORITÉ',es:'PUERTAS CUÁNTICAS · ATRACCIÓN DE AUTORIDAD',nl:'KWANTUMPOORTEN · AUTORITEITAANTREKKING',zh:'量子门 · 权威吸引',hi:'क्वांटम गेट्स · प्राधिकार आकर्षण'},
ana_algo_higgs_body:  {en:'Authority gates are spaced according to the Higgs mechanism: a quantum field that gives mass (weight) to particles that move through it. Gates gain stiffness as authority increases, resisting runaway authority.',ar:'يتم تباعد بوابات السلطة وفقًا لآلية هيجز: حقل كمي يعطي الكتلة (الوزن) للجزيئات التي تتحرك خلاله. اكتساب البوابات الصلابة مع زيادة السلطة، مما يقاوم تسارع السلطة.',fr:'Les portes d\'autorité sont espacées selon le mécanisme de Higgs : un champ quantique qui donne de la masse (poids) aux particules qui se déplacent à travers lui. Les portes gagnent en rigidité à mesure que l\'autorité augmente, résistant à l\'autorité galopante.',es:'Las puertas de autoridad están espaciadas según el mecanismo de Higgs: un campo cuántico que da masa (peso) a las partículas que se mueven a través de él. Las puertas ganan rigidez a medida que aumenta la autoridad, resistiendo la autoridad desbocada.',nl:'Autoriteitsheken zijn afgestemd op het Higgs-mechanisme: een kwantumveld dat massa (gewicht) geeft aan deeltjes die erdoor bewegen. Poorten winnen stijfheid als autoriteit toeneemt, wat losgeslagen autoriteit weerstaat.',zh:'权威门根据希格斯机制间隔：赋予通过它移动的粒子质量（重量）的量子场。随着权威增加，门获得刚度，抵抗失控权威。',hi:'प्राधिकार द्वार हिग्स तंत्र के अनुसार रिक्ति हैं: एक क्वांटम क्षेत्र जो इसके माध्यम से चलने वाले कणों को द्रव्यमान (वजन) देता है। जैसे-जैसे प्राधिकार बढ़ता है, गेट कठोरता प्राप्त करते हैं, जो भाग गए प्राधिकार का प्रतिरोध करते हैं।'},
ana_algo_deep_title:  {en:'DEEP LEARNING',ar:'التعلم العميق',fr:'APPRENTISSAGE PROFOND',es:'APRENDIZAJE PROFUNDO',nl:'DIEP LEREN',zh:'深度学习',hi:'गहन शिक्षा'},
ana_algo_deep_sub:    {en:'NEURAL AUTHORITY GATES · LEARNING CURVES',ar:'بوابات السلطة العصبية · منحنيات التعلم',fr:'PORTES D\'AUTORITÉ NEURALE · COURBES D\'APPRENTISSAGE',es:'PUERTAS DE AUTORIDAD NEURAL · CURVAS DE APRENDIZAJE',nl:'NEURALE AUTORITEITSHEKEN · LEERPLANEN',zh:'神经权威门 · 学习曲线',hi:'तंत्रिका प्राधिकार गेट्स · सीखने के वक्र'},
ana_algo_deep_body:   {en:'Authority progression is learned through every task completion. The platform builds a hidden neural profile of your learning patterns, biases, and momentum. Each node advances your personal learning curve.',ar:'يتم تعلم تقدم السلطة من خلال كل إكمال مهمة. تبني المنصة ملف تعريف عصبي مخفي لأنماط التعلم والانحيازات والزخم لديك. كل عقدة تقدم منحنى التعلم الشخصي الخاص بك.',fr:'La progression d\'autorité s\'apprend lors de chaque compliment de tâche. La plate-forme crée un profil neuronal caché de vos modèles d\'apprentissage, biais et élan. Chaque nœud fait progresser votre courbe d\'apprentissage personnelle.',es:'La progresión de autoridad se aprende mediante cada finalización de tarea. La plataforma construye un perfil neuronal oculto de sus patrones de aprendizaje, sesgos e impulso. Cada nodo avanza su curva de aprendizaje personal.',nl:'Autoriteitvoortgang wordt geleerd door elke taakvoltooiing. Het platform bouwt een verborgen neuraal profiel van uw leerpatronen, vooroordelen en momentum. Elk knooppunt beweegt uw persoonlijke leercurve.',zh:'权威进度通过每次任务完成来学习。该平台建立您的学习模式、偏见和动量的隐藏神经配置文件。每个节点推进您的个人学习曲线。',hi:'प्राधिकार प्रगति हर कार्य पूरा होने के माध्यम से सीखी जाती है। प्लेटफ़ॉर्म आपके सीखने के पैटर्न, पूर्वाग्रह और गति की एक छिपी हुई तंत्रिका प्रोफ़ाइल बनाता है। प्रत्येक नोड आपके व्यक्तिगत सीखने के वक्र को आगे बढ़ाता है।'},
ana_algo_loop_title:  {en:'LOOP ENGINEERING',ar:'هندسة الحلقة',fr:'INGÉNIERIE DE BOUCLE',es:'INGENIERÍA DE BUCLES',nl:'LUSENGINEERING',zh:'循环工程',hi:'लूप इंजीनियरिंग'},
ana_algo_loop_sub:    {en:'FOR LOOPS · AUTHORITY ACCELERATION',ar:'حلقات for · تسريع السلطة',fr:'BOUCLES FOR · ACCÉLÉRATION D\'AUTORITÉ',es:'BUCLES FOR · ACELERACIÓN DE AUTORIDAD',nl:'FOR-LUSSEN · AUTORITEITSVERSNELLING',zh:'For 循环 · 权威加速',hi:'For लूप्स · प्राधिकार त्वरण'},
ana_algo_loop_body:   {en:'Task completions are batched and processed as loops. A full cycle through all nodes (A³=9, B³=9, C³=9 at genesis) = 8,999 nodes. Repeated cycles accelerate authority gains through second-order effects.',ar:'يتم تجميع إكمالات المهام والمعالجة كحلقات. دورة كاملة من خلال جميع العقد (A³ = 9، B³ = 9، C³ = 9 في الجنة) = 8,999 عقدة. تسريع الدورات المتكررة لكسب السلطة من خلال التأثيرات من الدرجة الثانية.',fr:'Les compliments de tâches sont regroupés et traités comme des boucles. Un cycle complet à travers tous les nœuds (A³=9, B³=9, C³=9 à la genèse) = 8 999 nœuds. Les cycles répétés accélèrent les gains d\'autorité par des effets de second ordre.',es:'Los complementos de tarea se agrupan y se procesan como bucles. Un ciclo completo a través de todos los nodos (A³=9, B³=9, C³=9 en el génesis) = 8,999 nodos. Los ciclos repetidos aceleran las ganancias de autoridad a través de efectos de segundo orden.',nl:'Taakcomplementen worden batchgewijs verwerkt als lussen. Een volledige cyclus door alle knooppunten (A³=9, B³=9, C³=9 bij genesis) = 8.999 knooppunten. Herhaalde cycli versnellen autoriteitsgains door effecten van de tweede orde.',zh:'任务完成被批处理和处理为循环。通过所有节点的完整周期（A³=9，B³=9，C³=9 在创世纪）= 8,999 个节点。重复循环通过二阶效应加速权威收益。',hi:'कार्य पूरा होने को बैच किया जाता है और लूप्स के रूप में संसाधित किया जाता है। सभी नोड्स के माध्यम से एक पूर्ण चक्र (A³=9, B³=9, C³=9 जन्म में) = 8,999 नोड्स। दोहराए जाने वाले चक्र दूसरे क्रम के प्रभावों के माध्यम से प्राधिकार लाभ में तेजी लाते हैं।'},
ana_algo_complex_title:{en:'i²=−1 · COMPLEX PLANE GATES',ar:'i²=−1 · بوابات المستوى المعقدة',fr:'i²=−1 · PORTES DE PLAN COMPLEXE',es:'i²=−1 · PUERTAS DE PLANO COMPLEJO',nl:'i²=−1 · COMPLEXE VLAKPOORTEN',zh:'i²=−1 · 复平面门',hi:'i²=−1 · जटिल प्लेन गेट्स'},
ana_algo_complex_sub: {en:'IMAGINARY UNIT · GATE DAMPING',ar:'الوحدة التخيلية · تخفيف البوابة',fr:'UNITÉ IMAGINAIRE · AMORTISSEMENT DES PORTES',es:'UNIDAD IMAGINARIA · AMORTIGUAMIENTO DE PUERTAS',nl:'IMAGINAIRE EENHEID · POORTDEMPING',zh:'虚数单位 · 门阻尼',hi:'काल्पनिक इकाई · गेट डैम्पिंग'},
ana_algo_complex_body:{en:'Gate thresholds are computed in the complex plane. The imaginary unit i (where i²=−1) introduces phase-shift damping that prevents authority runaway at tier boundaries. φ, e, and i are all built into the formula.',ar:'يتم حساب عتبات البوابة في المستوى المعقد. تقدم الوحدة التخيلية i (حيث i²=−1) تخفيف تحول المرحلة الذي يمنع تسارع السلطة عند حدود الطبقة. φ و e و i مدمجة جميعها في الصيغة.',fr:'Les seuils de porte sont calculés dans le plan complexe. L\'unité imaginaire i (où i²=−1) introduit l\'amortissement du décalage de phase qui prévient l\'emballement de l\'autorité aux limites des niveaux. φ, e, et i sont tous intégrés dans la formule.',es:'Los umbrales de puerta se calculan en el plano complejo. La unidad imaginaria i (donde i²=−1) introduce el amortiguamiento de cambio de fase que previene el descontrol de la autoridad en los límites de nivel. φ, e, e i se incorporan en la fórmula.',nl:'Drempels voor poorten worden berekend in het complexe vlak. De imaginaire eenheid i (waarbij i²=−1) introduceert faseverschu demping die autoriteit-runaway op tierniveaugrenzen voorkomt. φ, e en i zijn allemaal ingebouwd in de formule.',zh:'门阈值在复平面中计算。虚数单位 i（其中 i²=−1）引入相位移位阻尼，防止权威在层界限处失控。φ、e 和 i 都内置在公式中。',hi:'गेट थ्रेसहोल्ड जटिल विमान में गणना की जाती है। काल्पनिक इकाई i (जहां i²=−1) चरण-शिफ्ट डैम्पिंग का परिचय देता है जो स्तर की सीमाओं पर प्राधिकार भागने को रोकता है। φ, e, और i सभी सूत्र में बनाए गए हैं।'},
ana_algo_goto_title:  {en:'GO TO CONSIDERED HARMFUL',ar:'GO TO تعتبر ضارة',fr:'GO TO JUGÉ NUISIBLE',es:'GO TO CONSIDERADO NOCIVO',nl:'GO TO BESCHOUWD ALS SCHADELIJK',zh:'GO TO被认为有害',hi:'GO TO को हानिकारक माना जाता है'},
ana_algo_goto_sub:    {en:'DIJKSTRA · NO SPAGHETTI LOGIC',ar:'ديجكسترا · بدون منطق السباغيتي',fr:'DIJKSTRA · PAS DE LOGIQUE SPAGHETTI',es:'DIJKSTRA · SIN LÓGICA DE ESPAGUETI',nl:'DIJKSTRA · GEEN SPAGHETTI-LOGICA',zh:'迪杰斯特拉 · 没有意大利面条逻辑',hi:'दिज्क्स्ट्रा · कोई स्पेगेटी तर्क नहीं'},
ana_algo_goto_body:   {en:'The platform enforces structured progression. No jump gates, no shortcuts. Members cannot skip nodes. Every transition is sequential and verified, following Dijkstra\'s principle: structured code structures structured minds.',ar:'تفرض المنصة تقدمًا منظمًا. لا توجد بوابات قفزة ولا اختصارات. لا يمكن للأعضاء تخطي العقد. كل انتقال متسلسل ومعتمد، متبعًا مبدأ ديجكسترا: الكود المنظم يهيكل العقول المنظمة.',fr:'La plateforme impose une progression structurée. Pas de portes de saut, pas de raccourcis. Les membres ne peuvent pas ignorer les nœuds. Chaque transition est séquentielle et vérifiée, suivant le principe de Dijkstra : le code structuré structure les esprits structurés.',es:'La plataforma impone una progresión estructurada. Sin puertas de salto, sin atajos. Los miembros no pueden omitir nodos. Cada transición es secuencial y verificada, siguiendo el principio de Dijkstra: el código estructurado estructura las mentes estructuradas.',nl:'Het platform dwingt gestructureerde voortgang af. Geen sprong gates, geen snelkoppelingen. Leden kunnen knopen niet overslaan. Elke overgang is opeenvolgend en geverifieerd, volgens het principe van Dijkstra: gestructureerde code structureert gestructureerde geesten.',zh:'该平台强制执行结构化进度。没有跳跃门，没有捷径。成员无法跳过节点。每次过渡都是顺序的和经过验证的，遵循迪杰斯特拉的原则：结构化代码结构化结构化的思维。',hi:'प्लेटफ़ॉर्म संरचित प्रगति को लागू करता है। कोई जंप गेट नहीं, कोई शॉर्टकट नहीं। सदस्य नोड्स को छोड़ नहीं सकते। प्रत्येक संक्रमण अनुक्रमिक और सत्यापित है, दिज्क्स्ट्रा के सिद्धांत का पालन करते हुए: संरचित कोड संरचित मन को संरचित करता है।'},
ana_algo_formula_title:{en:'FORMULA DERIVATION · COMPLETE MATHEMATICAL PROOF',ar:'اشتقاق الصيغة · الإثبات الرياضي الكامل',fr:'DÉRIVATION DE FORMULE · PREUVE MATHÉMATIQUE COMPLÈTE',es:'DERIVACIÓN DE FÓRMULA · PRUEBA MATEMÁTICA COMPLETA',nl:'FORMULEAFLEIDING · VOLLEDIG WISKUNDIG BEWIJS',zh:'公式推导 · 完整数学证明',hi:'सूत्र व्युत्पत्ति · पूर्ण गणितीय प्रमाण'},
ana_data_title:       {en:'DATA SCIENCE · PYTHON · ML · POSTGRESQL',ar:'علم البيانات · بايثون · التعلم الآلي · بوستجريسكيول',fr:'SCIENCE DES DONNÉES · PYTHON · ML · POSTGRESQL',es:'CIENCIA DE DATOS · PYTHON · ML · POSTGRESQL',nl:'DATAWETENSCHAPPEN · PYTHON · ML · POSTGRESQL',zh:'数据科学 · Python · 机器学习 · PostgreSQL',hi:'डेटा विज्ञान · पायथन · मशीन लर्निंग · PostgreSQL'},
ana_data_postgresql_title:{en:'POSTGRESQL · PGBOUNCER',ar:'بوستجريسكيول · بي جي باونسر',fr:'POSTGRESQL · PGBOUNCER',es:'POSTGRESQL · PGBOUNCER',nl:'POSTGRESQL · PGBOUNCER',zh:'PostgreSQL · PgBouncer',hi:'PostgreSQL · PgBouncer'},
ana_data_postgresql_sub:{en:'42 TABLES · 64 RPCS · CONNECTION POOLING',ar:'42 جدول · 64 اتصال RPC · تجميع الاتصال',fr:'42 TABLES · 64 RPCS · MISE EN POOL DES CONNEXIONS',es:'42 TABLAS · 64 RPCS · AGRUPACIÓN DE CONEXIONES',nl:'42 TABELLEN · 64 RPCS · VERBINDINGSPOOLING',zh:'42 个表 · 64 个 RPC · 连接池',hi:'42 तालिकाएं · 64 RPC · कनेक्शन पूलिंग'},
ana_data_postgresql_body:{en:'The platform runs on PostgreSQL with RLS on every table. PgBouncer-style connection pooling via Supabase pooler handles burst traffic. All queries use parameterized RPC calls. No raw SQL from the client.',ar:'تعمل المنصة على بوستجريسكيول مع RLS على كل جدول. يعالج تجميع الاتصالات بأسلوب بي جي باونسر عبر منصة Supabase حركة المرور المفاجئة. تستخدم جميع الاستعلامات استدعاءات RPC معاملة. لا توجد SQL خام من العميل.',fr:'La plateforme s\'exécute sur PostgreSQL avec RLS sur chaque tableau. Le pooling des connexions de style PgBouncer via Supabase pooler gère le trafic en burst. Toutes les requêtes utilisent des appels RPC paramétrés. Aucun SQL brut du client.',es:'La plataforma se ejecuta en PostgreSQL con RLS en cada tabla. El agrupamiento de conexiones de estilo PgBouncer a través del agrupador de Supabase maneja el tráfico en ráfaga. Todas las consultas utilizan llamadas RPC parametrizadas. Sin SQL sin procesar del cliente.',nl:'Het platform wordt uitgevoerd op PostgreSQL met RLS op elke tabel. PgBouncer-stijl verbindingspooling via Supabase pooler verwerkt burst-verkeer. Alle query\'s gebruiken geparametriseerde RPC-aanroepen. Geen ruwe SQL van de client.',zh:'该平台在 PostgreSQL 上运行，每个表都有 RLS。Supabase 池上的 PgBouncer 风格的连接池处理突发流量。所有查询使用参数化 RPC 调用。没有来自客户端的原始 SQL。',hi:'प्लेटफ़ॉर्म PostgreSQL पर चलता है, प्रत्येक तालिका पर RLS है। Supabase पूलर के माध्यम से PgBouncer-शैली कनेक्शन पूलिंग बर्स्ट ट्रैफिक को संभालता है। सभी क्वेरी पैरामीटर किए गए RPC कॉल का उपयोग करते हैं। क्लाइंट से कोई कच्चा SQL नहीं।'},
ana_data_python_title:{en:'PYTHON DATA PIPELINE',ar:'خط أنابيب بيانات بايثون',fr:'PIPELINE DE DONNÉES PYTHON',es:'TUBERÍA DE DATOS PYTHON',nl:'PYTHON-GEGEVENSPIJPLIJN',zh:'Python 数据管道',hi:'पायथन डेटा पाइपलाइन'},
ana_data_python_sub:  {en:'ETL · ANALYTICS · FEATURE ENGINEERING',ar:'ETL · التحليلات · هندسة الميزات',fr:'ETL · ANALYTIQUE · INGÉNIERIE DES CARACTÉRISTIQUES',es:'ETL · ANÁLISIS · INGENIERÍA DE CARACTERÍSTICAS',nl:'ETL · ANALYTIEK · FEATURE ENGINEERING',zh:'ETL · 分析 · 特征工程',hi:'ETL · विश्लेषण · विशेषता इंजीनियरिंग'},
ana_data_python_body: {en:'The progression data pipeline mirrors a Python ML workflow: ingest events (ETL), transform axis coordinates (feature engineering), compute authority (model inference), detect milestones (classification).',ar:'يعكس خط أنابيب البيانات الترقيوية سير عمل ML في بايثون: استيعاب الأحداث (ETL)، تحويل إحداثيات المحور (هندسة الميزات)، حساب السلطة (استدلال النموذج)، الكشف عن المعالم (التصنيف).',fr:'Le pipeline de données de progression reflète un flux de travail ML Python : ingérer les événements (ETL), transformer les coordonnées des axes (ingénierie des caractéristiques), calculer l\'autorité (inférence de modèle), détecter les jalons (classification).',es:'La canalización de datos de progresión refleja un flujo de trabajo ML de Python: ingesta de eventos (ETL), transformación de coordenadas de eje (ingeniería de características), cálculo de autoridad (inferencia de modelo), detección de hitos (clasificación).',nl:'De progressie-datapipeline weerspiegelt een Python ML-workflow: opname van gebeurtenissen (ETL), transformatie van ascoördinaten (feature engineering), berekening van autoriteit (modelinferentie), detectie van mijlpalen (classificatie).',zh:'进度数据管道反映 Python ML 工作流：摄取事件 (ETL)、变换轴坐标（特征工程）、计算权威（模型推理）、检测里程碑（分类）。',hi:'प्रगति डेटा पाइपलाइन Python ML वर्कफ़्लो को प्रतिबिंबित करती है: इवेंट्स को इनजेस्ट करें (ETL), अक्ष निर्देशांक को रूपांतरित करें (विशेषता इंजीनियरिंग), प्राधिकार की गणना करें (मॉडल अनुमान), मील के पत्थर का पता लगाएं (वर्गीकरण)।'},
ana_data_system_title:{en:'SYSTEM DESIGN · BACKEND',ar:'تصميم النظام · الواجهة الخلفية',fr:'CONCEPTION SYSTÈME · BACKEND',es:'DISEÑO DE SISTEMA · BACKEND',nl:'SYSTEEMONTWERP · BACKEND',zh:'系统设计 · 后端',hi:'सिस्टम डिज़ाइन · बैकएंड'},
ana_data_system_sub:  {en:'MICROSERVICES · EDGE FUNCTIONS · CDN',ar:'الخدمات الصغيرة · وظائف الحافة · شبكة توصيل المحتوى',fr:'MICROSERVICES · FONCTIONS DE BORDURE · CDN',es:'MICROSERVICIOS · FUNCIONES DE BORDE · CDN',nl:'MICROSERVICES · EDGE FUNCTIONS · CDN',zh:'微服务 · Edge Functions · CDN',hi:'माइक्रोसर्विसेज · एज फंक्शंस · CDN'},
ana_data_system_body: {en:'Architecture: static frontend (Vercel CDN) → Supabase edge functions → PostgreSQL. The matrix engine runs as a PostgreSQL RPC. The AI concierge runs as a Supabase edge function calling the Anthropic API.',ar:'البنية: الواجهة الأمامية الثابتة (Vercel CDN) → وظائف حافة Supabase → PostgreSQL. يعمل محرك المصفوفة كمكالمة RPC في PostgreSQL. يعمل الكونسيرج الذكي كدالة حافة في Supabase تستدعي API Anthropic.',fr:'Architecture : frontend statique (Vercel CDN) → fonctions de bordure Supabase → PostgreSQL. Le moteur de matrice s\'exécute en tant que RPC PostgreSQL. Le concierge IA s\'exécute en tant que fonction de bordure Supabase appelant l\'API Anthropic.',es:'Arquitectura: frontend estático (Vercel CDN) → funciones de borde de Supabase → PostgreSQL. El motor de matriz se ejecuta como un RPC de PostgreSQL. El conserje de IA se ejecuta como una función de borde de Supabase que llama a la API de Anthropic.',nl:'Architectuur: statische frontend (Vercel CDN) → Supabase edge functions → PostgreSQL. De matrix-engine wordt uitgevoerd als een PostgreSQL RPC. De AI-conciërge wordt uitgevoerd als een Supabase edge function die de Anthropic API aanroept.',zh:'架构：静态前端 (Vercel CDN) → Supabase 边缘函数 → PostgreSQL。矩阵引擎作为 PostgreSQL RPC 运行。AI 礼宾部作为调用 Anthropic API 的 Supabase 边缘函数运行。',hi:'आर्किटेक्चर: स्थिर फ्रंटएंड (Vercel CDN) → Supabase edge functions → PostgreSQL। मैट्रिक्स इंजन PostgreSQL RPC के रूप में चलता है। AI कंसीयर्ज Anthropic API को कॉल करने वाले Supabase edge फ़ंक्शन के रूप में चलता है।'},
ana_data_devops_title:{en:'DEVOPS · LINUX · GITHUB',ar:'DevOps · لينكس · GitHub',fr:'DEVOPS · LINUX · GITHUB',es:'DEVOPS · LINUX · GITHUB',nl:'DEVOPS · LINUX · GITHUB',zh:'DevOps · Linux · GitHub',hi:'DevOps · Linux · GitHub'},
ana_data_devops_sub:  {en:'CI/CD · VERCEL · SUPABASE · ZERO BUILD',ar:'CI/CD · Vercel · Supabase · بناء صفر',fr:'CI/CD · VERCEL · SUPABASE · ZÉRO BUILD',es:'CI/CD · VERCEL · SUPABASE · COMPILACIÓN CERO',nl:'CI/CD · VERCEL · SUPABASE · NULBUILD',zh:'CI/CD · Vercel · Supabase · 零构建',hi:'CI/CD · Vercel · Supabase · जीरो बिल्ड'},
ana_data_devops_body: {en:'Deployment: push to GitHub main → Vercel auto-deploys static files. SQL migrations run in Supabase. Zero build steps. Pure static HTML. Fast, reliable, sovereign. TTFB <100ms worldwide.',ar:'النشر: الدفع إلى GitHub main → Vercel ينشر الملفات الثابتة تلقائيًا. تعمل ترحيلات SQL في Supabase. خطوات بناء صفر. HTML ثابت نقي. سريع وموثوق وسيادي. TTFB <100ms في جميع أنحاء العالم.',fr:'Déploiement : pousser vers GitHub main → Vercel déploie automatiquement les fichiers statiques. Les migrations SQL s\'exécutent dans Supabase. Zéro étapes de construction. HTML pur statique. Rapide, fiable, souverain. TTFB <100ms dans le monde.',es:'Implementación: insertar en GitHub main → Vercel implementa automáticamente archivos estáticos. Las migraciones SQL se ejecutan en Supabase. Cero pasos de compilación. HTML estático puro. Rápido, confiable, soberano. TTFB <100ms en todo el mundo.',nl:'Implementatie: push naar GitHub main → Vercel implementeert automatisch statische bestanden. SQL-migraties worden in Supabase uitgevoerd. Nulbouwstappen. Puur statische HTML. Snel, betrouwbaar, soeverein. TTFB <100ms wereldwijd.',zh:'部署：推送到 GitHub main → Vercel 自动部署静态文件。SQL 迁移在 Supabase 中运行。零构建步骤。纯静态 HTML。快速、可靠、主权。全球 TTFB <100ms。',hi:'तैनाती: GitHub main को पुश करें → Vercel स्वचालित रूप से स्थिर फ़ाइलें तैनात करता है। SQL माइग्रेशन Supabase में चलते हैं। शून्य निर्माण चरण। शुद्ध स्थिर HTML। तेज़, विश्वसनीय, संप्रभु। विश्वव्यापी TTFB <100ms।'},
ana_data_metrics_title:{en:'LIVE PLATFORM METRICS',ar:'مقاييس المنصة المباشرة',fr:'MÉTRIQUES DE PLATEFORME EN DIRECT',es:'MÉTRICAS DE PLATAFORMA EN DIRECTO',nl:'LIVE PLATFORMMETRIEKEN',zh:'实时平台指标',hi:'लाइव प्लेटफॉर्म मेट्रिक्स'},
ana_data_actionlog_title:{en:'VERIFIED ACTION LOG',ar:'سجل الإجراءات المعتمدة',fr:'JOURNAL DES ACTIONS VÉRIFIÉES',es:'REGISTRO DE ACCIONES VERIFICADAS',nl:'GEVERIFIEERDE ACTIELOG',zh:'已验证的操作日志',hi:'सत्यापित कार्रवाई लॉग'},
ana_data_actionlog_refresh:{en:'↻ REFRESH',ar:'↻ تحديث',fr:'↻ ACTUALISER',es:'↻ ACTUALIZAR',nl:'↻ VERNIEUWEN',zh:'↻ 刷新',hi:'↻ ताज़ा करें'},
ana_table_timestamp:{en:'TIMESTAMP',ar:'الطابع الزمني',fr:'HORODATAGE',es:'MARCA DE TIEMPO',nl:'TIJDSTEMPEL',zh:'时间戳',hi:'समयमुद्रा'},
ana_table_task:     {en:'TASK',ar:'المهمة',fr:'TÂCHE',es:'TAREA',nl:'TAAK',zh:'任务',hi:'कार्य'},
ana_table_axis:     {en:'AXIS',ar:'المحور',fr:'AXE',es:'EJE',nl:'AS',zh:'轴',hi:'अक्ष'},
ana_table_points:   {en:'POINTS',ar:'النقاط',fr:'POINTS',es:'PUNTOS',nl:'PUNTEN',zh:'积分',hi:'अंक'},
ana_table_auth:     {en:'AUTH AFTER',ar:'السلطة بعد',fr:'AUTH APRÈS',es:'AUTH DESPUÉS',nl:'AUTH NA',zh:'之后的权威',hi:'बाद का प्राधिकार'},
ana_science_title:  {en:'ANALYTICS ENGINE',ar:'محرك التحليلات',fr:'MOTEUR ANALYTIQUE',es:'MOTOR ANALÍTICO',nl:'ANALYTICS-ENGINE',zh:'分析引擎',hi:'विश्लेषण इंजन'},
ana_science_formula_title:{en:'AUTHORITY FORMULA',ar:'صيغة السلطة',fr:'FORMULE D\'AUTORITÉ',es:'FÓRMULA DE AUTORIDAD',nl:'AUTORITEITSFORMULE',zh:'权威公式',hi:'प्राधिकार सूत्र'},
ana_science_formula_body:{en:'AUTH = sqrt(A³+B³+C³) × φ/e. At apex (A=B=C=9), AUTH = 27.8367. φ=1.6180339887 (golden ratio), e=2.7182818285 (Euler\'s number). The ratio φ/e = 0.59528 is the sovereign constant.',ar:'السلطة = sqrt(A³+B³+C³) × φ/e. عند القمة (A=B=C=9)، السلطة = 27.8367. φ=1.6180339887 (النسبة الذهبية)، e=2.7182818285 (رقم أويلر). النسبة φ/e = 0.59528 هي الثابت السيادي.',fr:'AUTH = sqrt(A³+B³+C³) × φ/e. Au sommet (A=B=C=9), AUTH = 27.8367. φ=1.6180339887 (nombre d\'or), e=2.7182818285 (nombre d\'Euler). Le rapport φ/e = 0.59528 est la constante souveraine.',es:'AUTH = sqrt(A³+B³+C³) × φ/e. En el ápice (A=B=C=9), AUTH = 27.8367. φ=1.6180339887 (proporción áurea), e=2.7182818285 (número de Euler). La relación φ/e = 0.59528 es la constante soberana.',nl:'AUTH = sqrt(A³+B³+C³) × φ/e. Op apex (A=B=C=9), AUTH = 27.8367. φ=1.6180339887 (gulden verhouding), e=2.7182818285 (getal van Euler). De verhouding φ/e = 0.59528 is de soevereine constante.',zh:'AUTH = sqrt(A³+B³+C³) × φ/e。在顶点 (A=B=C=9) 处，AUTH = 27.8367。φ=1.6180339887（黄金比例），e=2.7182818285（欧拉数）。比率 φ/e = 0.59528 是主权常数。',hi:'AUTH = sqrt(A³+B³+C³) × φ/e। शीर्ष (A=B=C=9) पर, AUTH = 27.8367। φ=1.6180339887 (सुनहरा अनुपात), e=2.7182818285 (यूलर संख्या)। अनुपात φ/e = 0.59528 संप्रभु स्थिरांक है।'},
ana_science_matrix_title:{en:'MATRIX DIMENSIONS',ar:'أبعاد المصفوفة',fr:'DIMENSIONS DE LA MATRICE',es:'DIMENSIONES DE LA MATRIZ',nl:'MATRIXDIMENSIES',zh:'矩阵维度',hi:'मैट्रिक्स आयाम'},
ana_science_matrix_body:{en:'104,976 nodes = 12×12×9×9×9. Twelve zodiac signs × twelve Olympians × nine knowledge tiers × nine mastery tiers × nine contribution tiers. Each axis runs from 0.001 (genesis) to 9.000 (apex) in steps of 0.001.',ar:'104,976 عقدة = 12×12×9×9×9. اثنا عشر علامة برجية × اثنا عشر أولمبيًا × تسع طبقات معرفة × تسع طبقات إتقان × تسع طبقات مساهمة. يعمل كل محور من 0.001 (الجنة) إلى 9.000 (القمة) على خطوات 0.001.',fr:'104 976 nœuds = 12×12×9×9×9. Douze signes du zodiaque × douze Olympiens × neuf niveaux de connaissance × neuf niveaux de maîtrise × neuf niveaux de contribution. Chaque axe va de 0,001 (genèse) à 9,000 (apex) par étapes de 0,001.',es:'104,976 nodos = 12×12×9×9×9. Doce signos del zodiaco × doce olímpicos × nueve niveles de conocimiento × nueve niveles de dominio × nueve niveles de contribución. Cada eje va de 0.001 (génesis) a 9.000 (ápice) en pasos de 0.001.',nl:'104.976 knopen = 12×12×9×9×9. Twaalf dierenriemtekens × twaalf Olympiërs × negen kennislagen × negen meesterschapslagen × negen bijdragelagen. Elke as loopt van 0,001 (genesis) naar 9.000 (apex) in stappen van 0,001.',zh:'104,976 个节点 = 12×12×9×9×9。十二个黄道星座×十二个奥林匹克人×九个知识等级×九个掌握等级×九个贡献等级。每个轴从 0.001（创世纪）到 9.000（顶点）以 0.001 为单位运行。',hi:'104,976 नोड्स = 12×12×9×9×9। बारह राशियां × बारह ओलंपियन × नौ ज्ञान स्तर × नौ महारत स्तर × नौ योगदान स्तर। प्रत्येक अक्ष 0.001 (उत्पत्ति) से 9.000 (शीर्ष) तक 0.001 की वृद्धि में चलता है।'},
ana_science_chart_title:{en:'CHART ENGINE',ar:'محرك الرسوم البيانية',fr:'MOTEUR DE GRAPHIQUE',es:'MOTOR DE GRÁFICOS',nl:'KAARTMOTOR',zh:'图表引擎',hi:'चार्ट इंजन'},
ana_science_chart_body:{en:'All visualisations are rendered natively on HTML canvas using the OmegaChart engine (bg.js). No external charting libraries. The apex donut, axis bars, and radar are drawn directly in 2D context with requestAnimationFrame animation.',ar:'يتم تقديم جميع التصورات بشكل أصلي على HTML canvas باستخدام محرك OmegaChart (bg.js). لا توجد مكتبات رسوم بيانية خارجية. يتم رسم الدونات الكلاسيكية وأشرطة المحور والرادار مباشرة في سياق 2D مع رسوم متحركة requestAnimationFrame.',fr:'Toutes les visualisations sont rendues en natif sur HTML canvas en utilisant le moteur OmegaChart (bg.js). Aucune bibliothèque de graphiques externes. Le beignet d\'apex, les barres d\'axe et le radar sont dessinés directement en contexte 2D avec animation requestAnimationFrame.',es:'Todas las visualizaciones se representan de forma nativa en el canvas HTML usando el motor OmegaChart (bg.js). Sin bibliotecas de gráficos externas. La dona de ápice, las barras de eje y el radar se dibujan directamente en contexto 2D con animación requestAnimationFrame.',nl:'Alle visualisaties worden nief op HTML-canvas weergegeven met behulp van de OmegaChart-engine (bg.js). Geen externe grafieken bibliotheken. De apex-donut, asbalken en radar worden rechtstreeks in 2D-context getekend met requestAnimationFrame-animatie.',zh:'所有可视化都使用 OmegaChart 引擎 (bg.js) 在 HTML canvas 上以本机方式呈现。没有外部图表库。顶点甜甜圈、轴条和雷达直接在 2D 上下文中绘制，具有 requestAnimationFrame 动画。',hi:'सभी दृश्य OmegaChart इंजन (bg.js) का उपयोग करके HTML कैनवास पर मूल रूप से प्रस्तुत किए जाते हैं। कोई बाहरी चार्टिंग लाइब्रेरी नहीं। शीर्ष डोनट, अक्ष सलाखें और रडार सीधे requestAnimationFrame एनिमेशन के साथ 2D संदर्भ में खींचे जाते हैं।'},
ana_science_tasklog_title:{en:'TASK LOG',ar:'سجل المهام',fr:'JOURNAL DES TÂCHES',es:'REGISTRO DE TAREAS',nl:'TAAKLOGBOEK',zh:'任务日志',hi:'कार्य लॉग'},
ana_science_tasklog_body:{en:'Task completions are stored in task_completions with axis_type, points_earned, and auth_after. The get_my_task_log RPC returns the full verified action history for the authenticated member.',ar:'يتم تخزين إكمالات المهام في task_completions مع axis_type و points_earned و auth_after. يعيد RPC get_my_task_log سجل الإجراءات المعتمدة الكامل للعضو المصرح به.',fr:'Les compliments de tâches sont stockés dans task_completions avec axis_type, points_earned et auth_after. L\'appel RPC get_my_task_log renvoie l\'historique complet des actions vérifiées pour le membre authentifié.',es:'Los complementos de tarea se almacenan en task_completions con axis_type, points_earned y auth_after. El RPC get_my_task_log devuelve el historial completo de acciones verificadas para el miembro autenticado.',nl:'Taakcomplementen worden opgeslagen in task_completions met axis_type, points_earned en auth_after. De RPC get_my_task_log retourneert de volledige geverifieerde actieverleden voor het geverifieerde lid.',zh:'任务完成存储在 task_completions 中，包含 axis_type、points_earned 和 auth_after。get_my_task_log RPC 返回经过身份验证的成员的完整已验证操作历史。',hi:'कार्य पूरा होना task_completions में axis_type, points_earned और auth_after के साथ संग्रहीत है। get_my_task_log RPC प्रमाणित सदस्य के लिए पूर्ण सत्यापित कार्रवाई इतिहास लौटाता है।'},

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

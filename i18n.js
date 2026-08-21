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

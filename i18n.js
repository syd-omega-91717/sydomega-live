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

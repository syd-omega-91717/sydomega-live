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

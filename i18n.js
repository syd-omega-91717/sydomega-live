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

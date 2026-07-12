/* SYD OMEGA 91717  --  i18n Multilingual Engine v1.0
   Supports: EN (default), AR (RTL), FR, ES
   Usage: add data-i18n="key" to any element.
   Inject <script src="/i18n.js"></script> after nav.js.
   Language switcher auto-injected into every page. */
(function(){
  if(window.__omegaI18n) return; window.__omegaI18n=true;

  var LANGS={
    EN:{dir:'ltr',label:'EN',name:'English'},
    AR:{dir:'rtl',label:'\u0639\u0631',name:'\u0639\u0631\u0628\u064A'},
    FR:{dir:'ltr',label:'FR',name:'Fran\u00E7ais'},
    ES:{dir:'ltr',label:'ES',name:'Espa\u00F1ol'}
  };

  var T={
    /* ---- ACADEMY + GAMING batch ---- */
    'ui.leave':{EN:'LEAVE',AR:'\u0645\u063A\u0627\u062F\u0631\u0629',FR:'QUITTER',ES:'SALIR'},
    'ui.retry':{EN:'RETRY',AR:'\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629',FR:'R\u00C9ESSAYER',ES:'REINTENTAR'},
    'ui.watch':{EN:'WATCH',AR:'\u0645\u0634\u0627\u0647\u062F\u0629',FR:'REGARDER',ES:'VER'},
    'ui.continue_btn':{EN:'CONTINUE',AR:'\u0645\u062A\u0627\u0628\u0639\u0629',FR:'CONTINUER',ES:'CONTINUAR'},
    'academy.eyebrow':{EN:'THE ACADEMY',AR:'\u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629',FR:'L\u2019ACAD\u00C9MIE',ES:'LA ACADEMIA'},
    'academy.twelve':{EN:'THE TWELVE DISCIPLINES',AR:'\u0627\u0644\u062A\u062E\u0635\u0635\u0627\u062A \u0627\u0644\u0627\u062B\u0646\u0627 \u0639\u0634\u0631',FR:'LES DOUZE DISCIPLINES',ES:'LAS DOCE DISCIPLINAS'},
    'academy.lesson':{EN:'LESSON',AR:'\u062F\u0631\u0633',FR:'LE\u00C7ON',ES:'LECCI\u00D3N'},
    'academy.signin':{EN:'Sign in to enter the Academy.',AR:'\u0633\u062C\u0651\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629.',FR:'Connectez-vous pour entrer dans l\u2019Acad\u00E9mie.',ES:'Inicie sesi\u00F3n para entrar en la Academia.'},
    'gaming.eyebrow':{EN:'THE GAMES',AR:'\u0627\u0644\u0623\u0644\u0639\u0627\u0628',FR:'LES JEUX',ES:'LOS JUEGOS'},
    'gaming.twelve':{EN:'THE TWELVE GAMES',AR:'\u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u0627\u062B\u0646\u0627 \u0639\u0634\u0631',FR:'LES DOUZE JEUX',ES:'LOS DOCE JUEGOS'},
    'gaming.stage':{EN:'STAGE',AR:'\u0645\u0631\u062D\u0644\u0629',FR:'NIVEAU',ES:'ETAPA'},
    'gaming.signin':{EN:'Sign in to enter the games.',AR:'\u0633\u062C\u0651\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u0623\u0644\u0639\u0627\u0628.',FR:'Connectez-vous pour acc\u00E9der aux jeux.',ES:'Inicie sesi\u00F3n para entrar en los juegos.'},
    'matrix.knowledge_t':{EN:'Knowledge',AR:'\u0627\u0644\u0645\u0639\u0631\u0641\u0629',FR:'Connaissance',ES:'Conocimiento'},
    'matrix.mastery_t':{EN:'Mastery',AR:'\u0627\u0644\u0625\u062A\u0642\u0627\u0646',FR:'Ma\u00EEtrise',ES:'Maestr\u00EDa'},
    /* ---- DASHBOARD + PROFILE batch ---- */
    'matrix.knowledge':{EN:'KNOWLEDGE',AR:'\u0627\u0644\u0645\u0639\u0631\u0641\u0629',FR:'CONNAISSANCE',ES:'CONOCIMIENTO'},
    'matrix.mastery':{EN:'MASTERY',AR:'\u0627\u0644\u0625\u062A\u0642\u0627\u0646',FR:'MA\u00CETRISE',ES:'MAESTR\u00CDA'},
    'matrix.contribution':{EN:'CONTRIBUTION',AR:'\u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0629',FR:'CONTRIBUTION',ES:'CONTRIBUCI\u00D3N'},
    'matrix.authority':{EN:'AUTHORITY',AR:'\u0627\u0644\u0633\u0644\u0637\u0629',FR:'AUTORIT\u00C9',ES:'AUTORIDAD'},
    'status.approved':{EN:'APPROVED',AR:'\u0645\u0648\u0627\u0641\u0642 \u0639\u0644\u064A\u0647',FR:'APPROUV\u00C9',ES:'APROBADO'},
    'status.complete':{EN:'COMPLETE',AR:'\u0645\u0643\u062A\u0645\u0644',FR:'TERMIN\u00C9',ES:'COMPLETO'},
    'status.pending':{EN:'PENDING',AR:'\u0645\u0639\u0644\u0642',FR:'EN ATTENTE',ES:'PENDIENTE'},
    'status.trial_active':{EN:'TRIAL ACTIVE',AR:'\u062A\u062C\u0631\u0628\u0629 \u0646\u0634\u0637\u0629',FR:'ESSAI ACTIF',ES:'PRUEBA ACTIVA'},
    'dash.quick_access':{EN:'QUICK ACCESS',AR:'\u0648\u0635\u0648\u0644 \u0633\u0631\u064A\u0639',FR:'ACC\u00C8S RAPIDE',ES:'ACCESO R\u00C1PIDO'},
    'dash.intel_feed':{EN:'LIVE INTEL FEED',AR:'\u0628\u062B \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631',FR:'FLUX D\u2019INFO EN DIRECT',ES:'FLUJO DE INTELIGENCIA'},
    'dash.agent_mesh':{EN:'AGENT MESH STATUS',AR:'\u062D\u0627\u0644\u0629 \u0634\u0628\u0643\u0629 \u0627\u0644\u0648\u0643\u0644\u0627\u0621',FR:'\u00C9TAT DU R\u00C9SEAU D\u2019AGENTS',ES:'ESTADO DE LA RED DE AGENTES'},
    'dash.requests_pending':{EN:'ACCESS REQUESTS PENDING',AR:'\u0637\u0644\u0628\u0627\u062A \u0648\u0635\u0648\u0644 \u0645\u0639\u0644\u0642\u0629',FR:'DEMANDES D\u2019ACC\u00C8S EN ATTENTE',ES:'SOLICITUDES DE ACCESO PENDIENTES'},
    'dash.sovereign_time':{EN:'SOVEREIGN TIME',AR:'\u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0633\u064A\u0627\u062F\u064A',FR:'TEMPS SOUVERAIN',ES:'TIEMPO SOBERANO'},
    'ui.no_results':{EN:'NO RESULTS',AR:'\u0644\u0627 \u0646\u062A\u0627\u0626\u062C',FR:'AUCUN R\u00C9SULTAT',ES:'SIN RESULTADOS'},
    'prof.access_level':{EN:'ACCESS LEVEL',AR:'\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0648\u0635\u0648\u0644',FR:'NIVEAU D\u2019ACC\u00C8S',ES:'NIVEL DE ACCESO'},
    'prof.achievements':{EN:'ACHIEVEMENTS',AR:'\u0627\u0644\u0625\u0646\u062C\u0627\u0632\u0627\u062A',FR:'R\u00C9ALISATIONS',ES:'LOGROS'},
    'prof.credentials':{EN:'CREDENTIALS',AR:'\u0623\u0648\u0631\u0627\u0642 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F',FR:'IDENTIFIANTS',ES:'CREDENCIALES'},
    'prof.dob':{EN:'DATE OF BIRTH',AR:'\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u064A\u0644\u0627\u062F',FR:'DATE DE NAISSANCE',ES:'FECHA DE NACIMIENTO'},
    'prof.full_name':{EN:'FULL NAME',AR:'\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644',FR:'NOM COMPLET',ES:'NOMBRE COMPLETO'},
    'prof.grade':{EN:'GRADE',AR:'\u0627\u0644\u0631\u062A\u0628\u0629',FR:'GRADE',ES:'GRADO'},
    'prof.blood_type':{EN:'BLOOD TYPE',AR:'\u0641\u0635\u064A\u0644\u0629 \u0627\u0644\u062F\u0645',FR:'GROUPE SANGUIN',ES:'GRUPO SANGU\u00CDNEO'},
    'prof.father':{EN:'FATHER\u2019S NAME',AR:'\u0627\u0633\u0645 \u0627\u0644\u0623\u0628',FR:'NOM DU P\u00C8RE',ES:'NOMBRE DEL PADRE'},
    'prof.frequency':{EN:'FREQUENCY',AR:'\u0627\u0644\u062A\u0631\u062F\u062F',FR:'FR\u00C9QUENCE',ES:'FRECUENCIA'},
    'prof.console':{EN:'ARCHITECT CONSOLE',AR:'\u0648\u062D\u062F\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0645\u0647\u0646\u062F\u0633',FR:'CONSOLE DE L\u2019ARCHITECTE',ES:'CONSOLA DEL ARQUITECTO'},
    'prof.extend':{EN:'EXTEND',AR:'\u062A\u0645\u062F\u064A\u062F',FR:'PROLONGER',ES:'EXTENDER'},
    'prof.all_members':{EN:'ALL MEMBERS',AR:'\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0639\u0636\u0627\u0621',FR:'TOUS LES MEMBRES',ES:'TODOS LOS MIEMBROS'},
    'prof.active_member':{EN:'ACTIVE MEMBER',AR:'\u0639\u0636\u0648 \u0646\u0634\u0637',FR:'MEMBRE ACTIF',ES:'MIEMBRO ACTIVO'},
    'prof.agent_assigned':{EN:'AGENT ASSIGNED',AR:'\u0627\u0644\u0648\u0643\u064A\u0644 \u0627\u0644\u0645\u0639\u064A\u0646',FR:'AGENT ASSIGN\u00C9',ES:'AGENTE ASIGNADO'},
    /* ---- ONBOARDING (login + approval flow) ---- */
    'pending.submitted':{EN:'ACCESS REQUEST SUBMITTED',AR:'\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0627\u0644\u0648\u0635\u0648\u0644',FR:'DEMANDE D\u2019ACC\u00C8S SOUMISE',ES:'SOLICITUD DE ACCESO ENVIADA'},
    'pending.registered':{EN:'YOUR IDENTITY HAS BEEN REGISTERED',AR:'\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0647\u0648\u064A\u062A\u0643',FR:'VOTRE IDENTIT\u00C9 A \u00C9T\u00C9 ENREGISTR\u00C9E',ES:'SU IDENTIDAD HA SIDO REGISTRADA'},
    'pending.review':{EN:'THE ARCHITECT WILL REVIEW AND GRANT ACCESS',AR:'\u0633\u064A\u0642\u0648\u0645 \u0627\u0644\u0645\u0647\u0646\u062F\u0633 \u0628\u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0645\u0646\u062D \u0627\u0644\u0648\u0635\u0648\u0644',FR:'L\u2019ARCHITECTE EXAMINERA ET ACCORDERA L\u2019ACC\u00C8S',ES:'EL ARQUITECTO REVISAR\u00C1 Y CONCEDER\u00C1 EL ACCESO'},
    'pending.trial_ended':{EN:'TRIAL SESSION ENDED',AR:'\u0627\u0646\u062A\u0647\u062A \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629',FR:'SESSION D\u2019ESSAI TERMIN\u00C9E',ES:'SESI\u00D3N DE PRUEBA FINALIZADA'},
    'pending.expired1':{EN:'Your 9.1717-minute trial has expired.',AR:'\u0627\u0646\u062A\u0647\u062A \u0641\u062A\u0631\u062A\u0643 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0627\u0644\u0628\u0627\u0644\u063A\u0629 9.1717 \u062F\u0642\u064A\u0642\u0629.',FR:'Votre essai de 9,1717 minutes a expir\u00E9.',ES:'Su prueba de 9,1717 minutos ha expirado.'},
    'pending.expired2':{EN:'Request renewed access from the Architect.',AR:'\u0627\u0637\u0644\u0628 \u0648\u0635\u0648\u0644\u0627\u064B \u0645\u062A\u062C\u062F\u062F\u0627\u064B \u0645\u0646 \u0627\u0644\u0645\u0647\u0646\u062F\u0633.',FR:'Demandez un acc\u00E8s renouvel\u00E9 \u00E0 l\u2019Architecte.',ES:'Solicite acceso renovado al Arquitecto.'},
    'pending.status_label':{EN:'ACCESS STATUS',AR:'\u062D\u0627\u0644\u0629 \u0627\u0644\u0648\u0635\u0648\u0644',FR:'STATUT D\u2019ACC\u00C8S',ES:'ESTADO DE ACCESO'},
    'pending.pending_review':{EN:'PENDING ARCHITECT REVIEW',AR:'\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0645\u0647\u0646\u062F\u0633',FR:'EN ATTENTE DE L\u2019EXAMEN DE L\u2019ARCHITECTE',ES:'PENDIENTE DE REVISI\u00D3N DEL ARQUITECTO'},
    'pending.personal':{EN:'The Architect reviews and approves all members personally.',AR:'\u064A\u0631\u0627\u062C\u0639 \u0627\u0644\u0645\u0647\u0646\u062F\u0633 \u0648\u064A\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0639\u0636\u0627\u0621 \u0634\u062E\u0635\u064A\u0627\u064B.',FR:'L\u2019Architecte examine et approuve chaque membre personnellement.',ES:'El Arquitecto revisa y aprueba a cada miembro personalmente.'},
    'pending.trial_note':{EN:'Access is granted for a sovereign trial period of 9.1717 minutes.',AR:'\u064A\u064F\u0645\u0646\u062D \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0641\u062A\u0631\u0629 \u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0633\u064A\u0627\u062F\u064A\u0629 \u0645\u062F\u062A\u0647\u0627 9.1717 \u062F\u0642\u064A\u0642\u0629.',FR:'L\u2019acc\u00E8s est accord\u00E9 pour une p\u00E9riode d\u2019essai souveraine de 9,1717 minutes.',ES:'El acceso se concede por un periodo de prueba soberano de 9,1717 minutos.'},
    'pending.check':{EN:'CHECK ACCESS STATUS',AR:'\u062A\u062D\u0642\u0642 \u0645\u0646 \u062D\u0627\u0644\u0629 \u0627\u0644\u0648\u0635\u0648\u0644',FR:'V\u00C9RIFIER LE STATUT D\u2019ACC\u00C8S',ES:'COMPROBAR ESTADO DE ACCESO'},
    'pending.signout':{EN:'SIGN OUT AND RETURN',AR:'\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0648\u0627\u0644\u0639\u0648\u062F\u0629',FR:'SE D\u00C9CONNECTER ET REVENIR',ES:'CERRAR SESI\u00D3N Y VOLVER'},
    'auth.member_access':{EN:'MEMBER ACCESS',AR:'\u0648\u0635\u0648\u0644 \u0627\u0644\u0623\u0639\u0636\u0627\u0621',FR:'ACC\u00C8S MEMBRE',ES:'ACCESO DE MIEMBRO'},
    'auth.join':{EN:'Join the Order',AR:'\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0627\u0644\u0646\u0638\u0627\u0645',FR:'Rejoindre l\u2019Ordre',ES:'\u00DAnete a la Orden'},
    'auth.email':{EN:'EMAIL',AR:'\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A',FR:'E-MAIL',ES:'CORREO'},
    'auth.password':{EN:'PASSWORD',AR:'\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',FR:'MOT DE PASSE',ES:'CONTRASE\u00D1A'},
    'auth.create':{EN:'CREATE ACCOUNT',AR:'\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628',FR:'CR\u00C9ER UN COMPTE',ES:'CREAR CUENTA'},
    'auth.login':{EN:'LOG IN',AR:'\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644',FR:'SE CONNECTER',ES:'INICIAR SESI\u00D3N'},
    'auth.threshold':{EN:'THE THRESHOLD',AR:'\u0627\u0644\u0639\u062A\u0628\u0629',FR:'LE SEUIL',ES:'EL UMBRAL'},
    'auth.set_cosmology':{EN:'Set Your Cosmology',AR:'\u062D\u062F\u062F \u0643\u0648\u0646\u064A\u0651\u062A\u0643',FR:'D\u00E9finissez votre cosmologie',ES:'Defina su cosmolog\u00EDa'},
    'auth.dob':{EN:'YOUR DATE OF BIRTH',AR:'\u062A\u0627\u0631\u064A\u062E \u0645\u064A\u0644\u0627\u062F\u0643',FR:'VOTRE DATE DE NAISSANCE',ES:'SU FECHA DE NACIMIENTO'},
    'auth.reveal_save':{EN:'REVEAL & SAVE',AR:'\u0627\u0643\u0634\u0641 \u0648\u0627\u062D\u0641\u0638',FR:'R\u00C9V\u00C9LER ET ENREGISTRER',ES:'REVELAR Y GUARDAR'},
    /* ---- NAVIGATION ---- */
    'nav.dashboard':{EN:'DASHBOARD',AR:'\u0644\u0648\u062D\u0629 \u0627\u0644\u0642\u064A\u0627\u062F\u0629',FR:'TABLEAU DE BORD',ES:'PANEL'},
    'nav.beacon':{EN:'THE BEACON',AR:'\u0627\u0644\u0645\u0646\u0627\u0631\u0629',FR:'LE PHARE',ES:'EL FAR\u00D3'},
    'nav.search':{EN:'SEARCH',AR:'\u0628\u062D\u062B',FR:'RECHERCHE',ES:'BUSCAR'},
    'nav.notifications':{EN:'NOTIFICATIONS',AR:'\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A',FR:'NOTIFICATIONS',ES:'NOTIFICACIONES'},
    'nav.profile':{EN:'PROFILE',AR:'\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A',FR:'PROFIL',ES:'PERFIL'},
    'nav.academy':{EN:'ACADEMY',AR:'\u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629',FR:'ACAD\u00C9MIE',ES:'ACADEMIA'},
    'nav.gaming':{EN:'GAMING ARENA',AR:'\u0633\u0627\u062D\u0629 \u0627\u0644\u0623\u0644\u0639\u0627\u0628',FR:'AR\u00C8NE DE JEU',ES:'ARENA DE JUEGOS'},
    'nav.agents':{EN:'AI AGENTS',AR:'\u0648\u0643\u0644\u0627\u0621 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A',FR:'AGENTS IA',ES:'AGENTES IA'},
    'nav.horoscope':{EN:'HOROSCOPE',AR:'\u0627\u0644\u062A\u0646\u062C\u064A\u0645',FR:'HOROSCOPE',ES:'HOR\u00D3SCOPO'},
    'nav.treasury':{EN:'TREASURY',AR:'\u0627\u0644\u062E\u0632\u064A\u0646\u0629',FR:'TR\u00C9SORERIE',ES:'TESORER\u00CDA'},
    'nav.family':{EN:'FAMILY',AR:'\u0627\u0644\u0639\u0627\u0626\u0644\u0629',FR:'FAMILLE',ES:'FAMILIA'},
    'nav.settings':{EN:'SETTINGS',AR:'\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A',FR:'PARAM\u00C8TRES',ES:'AJUSTES'},
    'nav.logout':{EN:'LOG OUT',AR:'\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C',FR:'QUITTER',ES:'SALIR'},
    'nav.home':{EN:'HOME',AR:'\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629',FR:'ACCUEIL',ES:'INICIO'},
    'nav.back':{EN:'BACK',AR:'\u0631\u062C\u0648\u0639',FR:'RETOUR',ES:'ATR\u00C1S'},
    /* ---- COMMON UI ---- */
    'ui.loading':{EN:'LOADING...',AR:'\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...',FR:'CHARGEMENT...',ES:'CARGANDO...'},
    'ui.save':{EN:'SAVE',AR:'\u062D\u0641\u0638',FR:'ENREGISTRER',ES:'GUARDAR'},
    'ui.submit':{EN:'SUBMIT',AR:'\u0625\u0631\u0633\u0627\u0644',FR:'SOUMETTRE',ES:'ENVIAR'},
    'ui.cancel':{EN:'CANCEL',AR:'\u0625\u0644\u063A\u0627\u0621',FR:'ANNULER',ES:'CANCELAR'},
    'ui.confirm':{EN:'CONFIRM',AR:'\u062A\u0623\u0643\u064A\u062F',FR:'CONFIRMER',ES:'CONFIRMAR'},
    'ui.continue':{EN:'CONTINUE',AR:'\u0645\u062A\u0627\u0628\u0639\u0629',FR:'CONTINUER',ES:'CONTINUAR'},
    'ui.active':{EN:'ACTIVE',AR:'\u0646\u0634\u0637',FR:'ACTIF',ES:'ACTIVO'},
    'ui.pending':{EN:'PENDING',AR:'\u0645\u0639\u0644\u0642',FR:'EN ATTENTE',ES:'PENDIENTE'},
    'ui.completed':{EN:'COMPLETED',AR:'\u0645\u0643\u062A\u0645\u0644',FR:'COMPLET',ES:'COMPLETADO'},
    'ui.locked':{EN:'LOCKED',AR:'\u0645\u0642\u0641\u0644',FR:'VERROUILL\u00C9',ES:'BLOQUEADO'},
    'ui.viewAll':{EN:'VIEW ALL',AR:'\u0639\u0631\u0636 \u0627\u0644\u0643\u0644',FR:'VOIR TOUT',ES:'VER TODO'},
    'ui.enter':{EN:'ENTER',AR:'\u062F\u062E\u0648\u0644',FR:'ENTRER',ES:'ENTRAR'},
    'ui.level':{EN:'LEVEL',AR:'\u0645\u0633\u062A\u0648\u0649',FR:'NIVEAU',ES:'NIVEL'},
    'ui.rank':{EN:'RANK',AR:'\u0631\u062A\u0628\u0629',FR:'RANG',ES:'RANGO'},
    'ui.score':{EN:'SCORE',AR:'\u0646\u062A\u064A\u062C\u0629',FR:'SCORE',ES:'PUNTUACI\u00D3N'},
    'ui.authority':{EN:'AUTHORITY',AR:'\u0633\u0644\u0637\u0629',FR:'AUTORIT\u00C9',ES:'AUTORIDAD'},
    'ui.sovereign':{EN:'SOVEREIGN',AR:'\u0633\u064A\u0627\u062F\u0629',FR:'SOUVERAIN',ES:'SOBERANO'},
    /* ---- PLATFORM IDENTITY ---- */
    'id.tagline':{EN:'BUILD \u00B7 AUTOMATE \u00B7 REASON \u00B7 EXECUTE \u00B7 SCALE',AR:'\u0627\u0628\u0646\u00B7\u0622\u0644\u064A\u00B7\u0627\u0633\u062A\u0646\u062A\u062C\u00B7\u0646\u0641\u0651\u0630\u00B7\u062A\u0637\u0648\u0651\u0631',FR:'CONSTRUIRE \u00B7 AUTOMATISER \u00B7 RAISONNER \u00B7 EX\u00C9CUTER \u00B7 GRANDIR',ES:'CONSTRUIR \u00B7 AUTOMATIZAR \u00B7 RAZONAR \u00B7 EJECUTAR \u00B7 ESCALAR'},
    'id.frequency':{EN:'9.17 Hz RESONANCE LOCK',AR:'\u062A\u0631\u062F\u062F 9.17 \u0647\u0631\u062A\u0632',FR:'VERROUILLAGE R\u00C9SONANCE 9.17 Hz',ES:'BLOQUEO DE RESONANCIA 9.17 Hz'},
    'id.sovereign':{EN:'SOVEREIGN \u00B7 SECURE \u00B7 IMMORTAL',AR:'\u0633\u064A\u0627\u062F\u00B7\u0622\u0645\u0646\u00B7\u062E\u0627\u0644\u062F',FR:'SOUVERAIN \u00B7 S\u00C9CURIS\u00C9 \u00B7 IMMORTEL',ES:'SOBERANO \u00B7 SEGURO \u00B7 INMORTAL'},
    /* ---- MATRIX ---- */
    'matrix.title':{EN:'THE 9x9x9 MATRIX',AR:'\u0645\u0635\u0641\u0648\u0641\u0629 9\u00D79\u00D79',FR:'LA MATRICE 9\u00D79\u00D79',ES:'LA MATRIZ 9\u00D79\u00D79'},
    'matrix.nodes':{EN:'EVOLUTION NODES',AR:'\u0639\u0642\u062F \u0627\u0644\u062A\u0637\u0648\u0631',FR:'N\u0152UDS D\u2019\u00C9VOLUTION',ES:'NODOS DE EVOLUCI\u00D3N'},
    'matrix.knowledge':{EN:'KNOWLEDGE AXIS',AR:'\u0645\u062D\u0648\u0631 \u0627\u0644\u0645\u0639\u0631\u0641\u0629',FR:'AXE CONNAISSANCE',ES:'EJE CONOCIMIENTO'},
    'matrix.mastery':{EN:'MASTERY AXIS',AR:'\u0645\u062D\u0648\u0631 \u0627\u0644\u0625\u062A\u0642\u0627\u0646',FR:'AXE MA\u00CETRISE',ES:'EJE MAESTR\u00CDA'},
    'matrix.contribution':{EN:'CONTRIBUTION AXIS',AR:'\u0645\u062D\u0648\u0631 \u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0629',FR:'AXE CONTRIBUTION',ES:'EJE CONTRIBUCI\u00D3N'},
    /* ---- MEMBERSHIP ---- */
    'tier.initiate':{EN:'INITIATE',AR:'\u0645\u0628\u062A\u062F\u0626',FR:'INITIATE',ES:'INICIADO'},
    'tier.seeker':{EN:'SEEKER',AR:'\u0628\u0627\u062D\u062B',FR:'CHERCHEUR',ES:'BUSCADOR'},
    'tier.adept':{EN:'ADEPT',AR:'\u0645\u062A\u0642\u062F\u0645',FR:'EXPERT',ES:'ADEPTO'},
    'tier.sovereign':{EN:'SOVEREIGN',AR:'\u0633\u064A\u0627\u062F\u0629',FR:'SOUVERAIN',ES:'SOBERANO'},
  };

  function getLang(){
    var stored=localStorage.getItem('omega_lang');
    if(stored&&LANGS[stored]) return stored;
    var nav=navigator.language||'en';
    if(nav.startsWith('ar')) return 'AR';
    if(nav.startsWith('fr')) return 'FR';
    if(nav.startsWith('es')) return 'ES';
    return 'EN';
  }

  function applyLang(lang){
    if(!LANGS[lang]) lang='EN';
    localStorage.setItem('omega_lang',lang);
    var L=LANGS[lang];
    /* RTL */
    document.documentElement.setAttribute('dir',L.dir);
    document.documentElement.setAttribute('lang',lang.toLowerCase());
    if(L.dir==='rtl'){
      document.documentElement.style.setProperty('--dir','rtl');
      document.documentElement.style.setProperty('--side-float','right');
    } else {
      document.documentElement.style.setProperty('--dir','ltr');
      document.documentElement.style.setProperty('--side-float','left');
    }
    /* Apply data-i18n attributes */
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var key=el.getAttribute('data-i18n');
      var val=T[key];
      if(val&&val[lang]) el.textContent=val[lang];
    });
    /* Update switcher */
    var sw=document.getElementById('omega-lang-sw');
    if(sw){
      sw.querySelectorAll('.ol-btn').forEach(function(btn){
        btn.classList.toggle('ol-active',btn.dataset.lang===lang);
      });
    }
    /* nav items update */
    updateNav(lang);
  }

  function updateNav(lang){
    var navLinks={'dashboard':'nav.dashboard','beacon':'nav.beacon','search':'nav.search',
      'notifications':'nav.notifications','profile':'nav.profile','academy':'nav.academy',
      'gaming':'nav.gaming','agents':'nav.agents','horoscope':'nav.horoscope',
      'treasury':'nav.treasury','family':'nav.family','settings':'nav.settings'};
    document.querySelectorAll('.nav a').forEach(function(a){
      var href=a.getAttribute('href')||'';
      var page=href.replace('/','').replace('.html','');
      var key=navLinks[page];
      if(key&&T[key]&&T[key][lang]) a.textContent=T[key][lang];
    });
    var out=document.getElementById('logout');
    if(out&&T['nav.logout']&&T['nav.logout'][lang]) out.textContent=T['nav.logout'][lang]+' \u2192';
    var back=document.getElementById('omega-back');
    if(back&&T['nav.back']&&T['nav.back'][lang]) back.textContent='\u2190 '+T['nav.back'][lang];
    var home=document.querySelector('.nav-home');
    if(home&&T['nav.home']&&T['nav.home'][lang]) home.innerHTML='\u2302 '+T['nav.home'][lang];
  }

  function injectSwitcher(){
    if(document.getElementById('omega-lang-sw')) return;
    var sw=document.createElement('div'); sw.id='omega-lang-sw';
    sw.style.cssText='position:fixed;bottom:108px;right:18px;z-index:9996;display:flex;flex-direction:column;gap:4px';
    Object.keys(LANGS).forEach(function(lang){
      var btn=document.createElement('button'); btn.className='ol-btn'; btn.dataset.lang=lang;
      btn.textContent=LANGS[lang].label;
      btn.style.cssText='font-family:"Courier Prime",monospace;font-size:9px;letter-spacing:2px;padding:5px 10px;background:rgba(7,7,11,0.9);border:1px solid rgba(201,168,76,0.2);color:#85837b;cursor:pointer;transition:all .15s;width:44px;text-align:center';
      btn.addEventListener('click',function(){ applyLang(lang); });
      btn.addEventListener('mouseenter',function(){ if(!btn.classList.contains('ol-active')) btn.style.color='#C9A84C'; });
      btn.addEventListener('mouseleave',function(){ if(!btn.classList.contains('ol-active')) btn.style.color='#85837b'; });
      sw.appendChild(btn);
    });
    /* active style */
    var css=document.createElement('style');
    css.textContent='.ol-btn.ol-active{color:#C9A84C!important;border-color:#C9A84C!important;background:rgba(201,168,76,0.1)!important}';
    document.head.appendChild(css);
    document.body.appendChild(sw);
  }

  /* RTL layout adjustments */
  function injectRTLStyle(){
    if(document.getElementById('omega-rtl-css')) return;
    var s=document.createElement('style'); s.id='omega-rtl-css';
    s.textContent=[
      '[dir="rtl"] .side{border-right:none;border-left:1px solid rgba(201,168,76,0.16)}',
      '[dir="rtl"] .nav a{border-left:none;border-right:2px solid transparent;text-align:right}',
      '[dir="rtl"] .nav a:hover,[dir="rtl"] .nav a.on{border-right-color:#C9A84C;border-left:none}',
      '[dir="rtl"] .topbar .t small{direction:rtl}',
      '[dir="rtl"] .nav-hb{flex-direction:row-reverse}',
      '[dir="rtl"] .ident-bar{flex-direction:row-reverse}',
      '[dir="rtl"] .nav-out{flex-direction:row-reverse}',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* Expose public API */
  window.OmegaI18n={
    t:function(key,fallback){ var l=getLang(); return (T[key]&&T[key][l])||fallback||key; },
    lang:getLang,
    set:applyLang,
    langs:LANGS
  };

  /* Boot */
  function boot(){
    injectRTLStyle();
    injectSwitcher();
    applyLang(getLang());
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();

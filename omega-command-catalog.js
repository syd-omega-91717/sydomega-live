/* Ω COMMAND CATALOG — production-safe slash command registry
 * 99 commands adapted from the SYD OMEGA command language.
 * Commands are intent metadata only; execution must be handled by an authorized runtime.
 */
(function (global) {
  'use strict';
  const groups = {
    EMAIL: ['DECLINE','SHORTEN','WARMER','FOLLOWUP','SAYNO','BULLET2EMAIL','THANKS','CONFIDENT','OOO','HARDSG','INTRO'],
    WRITE: ['PROOF','REWRITES','CUTHALF','OPENERS','FILLER','ACTIVE','HUMAN','EXAMPLES','SIMPLIFY','TITLES','TONE'],
    THINK: ['CHOOSE','REALPC','BLINDSPOT','STEELMAN','DEVIL','SKEPTIC','STEPS','RIPPLE','PREMORTEM','MINTEST'],
    LEARN: ['ELI10','PRIMER','MYTHS','ANALOGY','QUIZ','COMPARE','PREREQ','SUM3','GLOSSARY','ASKBETTER','MENTALMODEL'],
    PLAN: ['WEEK','MILESTONES','PACK','SCHEDULE','ROUTINE','PRIORITIZE','MEALS','AGENDA','PREPTIME','ORDER','CHECKLIST'],
    BRAINSTORM: ['IDEAS20','GIFTS','NAMES','UNUSUAL','ANGLE','COMBINE','METAPHOR','STARTERS','JOURNAL10','AS','CHILD'],
    MEETINGS: ['MEETINGNOTES','ACTIONITEMS','STANDUP','RECAP','DECISIONS','QUESTIONS','STATUS','BRIEFME','DEBRIEF','TLDR','RETRO'],
    CAREER: ['INTERVIEWQ','RESUMEBULLET','ASKINTERVIEWER','NEGOTIATE','RECONNECT','GAP','WINS5','ONBOARDME','SELFREVIEW','IDONTKNOW','RAISE'],
    CONTENT: ['HOOK','CAPTION','THREAD','CARO','REPURPOSE','CTA','BIO','SUBJECT','CONTRARIAN','SHORTPOST','COMMENT']
  };
  const descriptions = {
    DECLINE:'polite refusal', SHORTEN:'shorten while preserving key points', WARMER:'make warmer', FOLLOWUP:'follow up on an unanswered message', SAYNO:'protect the relationship while declining',
    BULLET2EMAIL:'turn bullets into a clean email', THANKS:'write a sincere thank-you', CONFIDENT:'remove hedging and apology', OOO:'create an out-of-office reply', HARDSG:'deliver a difficult message respectfully', INTRO:'create a double-opt-in introduction',
    PROOF:'proofread text', REWRITES:'create five rewrites', CUTHALF:'cut length by roughly half', OPENERS:'create stronger opening lines', FILLER:'identify weak filler', ACTIVE:'convert passive voice to active', HUMAN:'make writing natural', EXAMPLES:'add useful examples', SIMPLIFY:'simplify language', TITLES:'suggest titles', TONE:'rewrite in a requested tone',
    CHOOSE:'weigh options', REALPC:'map pros and cons', BLINDSPOT:'surface overlooked risks', STEELMAN:'strengthen the opposing view', DEVIL:'challenge the idea', SKEPTIC:'generate skeptical questions', STEPS:'walk through the problem', RIPPLE:'map second-order consequences', PREMORTEM:'analyze how the plan could fail', MINTEST:'define the smallest useful test',
    ELI10:'explain simply', PRIMER:'provide a crash course', MYTHS:'identify misconceptions', ANALOGY:'create an analogy', QUIZ:'generate five questions', COMPARE:'compare two subjects', PREREQ:'identify prerequisites', SUM3:'summarize in three bullets', GLOSSARY:'define key terms', ASKBETTER:'generate better questions', MENTALMODEL:'provide the key mental model',
    WEEK:'plan the week', MILESTONES:'create checkpoints', PACK:'create a packing list', SCHEDULE:'create a timed schedule', ROUTINE:'create a daily routine', PRIORITIZE:'rank tasks', MEALS:'plan meals', AGENDA:'create a meeting agenda', PREPTIME:'fit preparation to available time', ORDER:'sequence tasks', CHECKLIST:'create a step-by-step checklist',
    IDEAS20:'generate twenty ideas', GIFTS:'suggest gifts', NAMES:'generate names', UNUSUAL:'find unconventional approaches', ANGLE:'find overlooked angles', COMBINE:'combine two concepts', METAPHOR:'create a metaphor', STARTERS:'create conversation starters', JOURNAL10:'generate journal prompts', AS:'solve from a named professional perspective', CHILD:'approach a problem with childlike curiosity',
    MEETINGNOTES:'turn transcript into minutes', ACTIONITEMS:'extract actions and owners', STANDUP:'format a standup', RECAP:'create a concise recap', DECISIONS:'extract decisions', QUESTIONS:'generate questions', STATUS:'create project status', BRIEFME:'prepare a briefing', DEBRIEF:'analyze a meeting', TLDR:'create a shortest useful summary', RETRO:'run a retrospective',
    INTERVIEWQ:'prepare confident interview answers', RESUMEBULLET:'rewrite a resume bullet', ASKINTERVIEWER:'suggest smart interviewer questions', NEGOTIATE:'prepare negotiation language', RECONNECT:'draft a professional reconnection', GAP:'explain a career gap', WINS5:'turn notes into five accomplishments', ONBOARDME:'prepare a manager 1:1', SELFREVIEW:'draft a self-review', IDONTKNOW:'phrase uncertainty professionally', RAISE:'prepare a compensation discussion',
    HOOK:'create scroll-stopping openers', CAPTION:'write a concise caption', THREAD:'outline a six-part thread', CARO:'outline a carousel', REPURPOSE:'repurpose content into formats', CTA:'create calls to action', BIO:'write a short bio', SUBJECT:'create subject lines', CONTRARIAN:'develop a defensible counter-take', SHORTPOST:'write a short post', COMMENT:'create useful replies'
  };
  const catalog = Object.entries(groups).flatMap(([group, names]) => names.map((name, i) => ({ id:`/${name}`, name, group, order:i+1, description:descriptions[name] || name })));
  global.OMEGA_COMMAND_CATALOG = Object.freeze({ version:'1.0.0', count:catalog.length, groups:Object.freeze(groups), commands:Object.freeze(catalog) });
})(window);

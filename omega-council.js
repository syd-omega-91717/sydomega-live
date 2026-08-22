/**
 * OMEGA COUNCIL – Decision & Deliberation Engine
 * Multi-agent consensus system for production-readiness and high-stakes decisions.
 *
 * Architecture: Architect, Engineer, Security, Red-Team, Auditor, Researcher, Pragmatist
 * Output: Structured verdict with consensus, disagreements, evidence, confidence, risks.
 *
 * NOT an oracle — value is independent perspectives, adversarial scrutiny, synthesis.
 * @module OmegaCouncil
 * @exports {Object} OmegaCouncil Public API for deliberation and consensus
 */

(function() {
  'use strict';

  /**
   * @type {Array<{role: string, title: string, icon: string, responsibility: string, specialty: string}>}
   * Council roles with their responsibilities and specialties
   */
  const COUNCIL_ROLES = [
    {
      role: 'architect',
      title: 'Architect',
      icon: '🏗',
      responsibility: 'System design and architectural coherence',
      specialty: 'Does the architecture make sense? Is it sound?'
    },
    {
      role: 'engineer',
      title: 'Engineer',
      icon: '⚙',
      responsibility: 'Implementation completeness and correctness',
      specialty: 'Is it actually implemented? Does it work?'
    },
    {
      role: 'security',
      title: 'Security',
      icon: '🔒',
      responsibility: 'Vulnerability assessment and threat modeling',
      specialty: 'What vulnerabilities remain? What could be exploited?'
    },
    {
      role: 'red-team',
      title: 'Red Team',
      icon: '⚔',
      responsibility: 'Adversarial analysis and failure modes',
      specialty: 'How could this fail? What are edge cases?'
    },
    {
      role: 'auditor',
      title: 'Evidence Auditor',
      icon: '📋',
      responsibility: 'Verification of evidence and claims',
      specialty: 'What claims lack proof? What\'s unverified?'
    },
    {
      role: 'researcher',
      title: 'Researcher',
      icon: '🔬',
      responsibility: 'Technical assumptions and best practices',
      specialty: 'Are assumptions valid? Does this follow best practices?'
    },
    {
      role: 'pragmatist',
      title: 'Pragmatist',
      icon: '⚡',
      responsibility: 'Practical deployment and operational readiness',
      specialty: 'What must be fixed before deployment? Timeline?'
    }
  ];

  const VERDICT_STATES = {
    READY: { label: 'READY', color: '#22C55E', description: 'Consensus: production-ready' },
    NOT_READY: { label: 'NOT READY', color: '#EF4444', description: 'Consensus: not production-ready' },
    CONDITIONAL: { label: 'CONDITIONAL', color: '#F59E0B', description: 'Conditional approval with required actions' },
    PENDING: { label: 'PENDING', color: '#6B7280', description: 'Deliberation in progress' }
  };

  window.OmegaCouncil = {
    /**
     * Request a deliberation on a specific topic/decision
     * @param {string} subject - The topic or decision being deliberated
     * @param {string} context - Background context and evidence for the deliberation
     * @param {string} [depth='standard'] - Deliberation depth: 'quick', 'standard', or 'deep'
     * @returns {Promise<Object|null>} Deliberation object with roles, analyses, and synthesis, or null on error
     */
    async deliberate(subject, context, depth = 'standard') {
      if (!subject || !context) {
        console.error('OmegaCouncil: subject and context required');
        return null;
      }

      const deliberation = {
        id: `council_${Date.now()}`,
        timestamp: new Date().toISOString(),
        subject,
        context,
        depth, // quick, standard, deep
        status: 'in_progress',
        roles: COUNCIL_ROLES.map(r => ({
          ...r,
          analysis: null,
          confidence: 0,
          verdict: null,
          evidence: [],
          risks: [],
          questions: []
        })),
        synthesis: null,
        final_verdict: VERDICT_STATES.PENDING,
        timeline_recorded: null
      };

      // Record deliberation start
      if (window.OmegaSupabase?.sb) {
        const sb = window.OmegaSupabase.sb;
        const sess = await sb.auth.getSession();
        const userId = sess?.data?.session?.user?.id;
        if (userId) {
          const { error } = await sb.from('council_deliberations').insert({
            user_id: userId,
            subject,
            context,
            depth,
            status: 'in_progress',
            roles_snapshot: deliberation.roles,
            created_at: new Date().toISOString()
          });
          if (error) {
            console.warn('OmegaCouncil: Could not record deliberation start', error);
          }
        }
      }

      return deliberation;
    },

    /**
     * Add a role's analysis to the deliberation
     * @param {Object|null} deliberation - The deliberation object to update
     * @param {string|null} role - The council role key providing analysis
     * @param {Object|null} analysis - Analysis object with text, confidence, verdict, evidence, risks, questions
     * @returns {Object|null} Updated deliberation object, or null on invalid input
     */
    addAnalysis(deliberation, role, analysis) {
      if (!deliberation || !role || !analysis) return null;

      const roleIdx = deliberation.roles.findIndex(r => r.role === role);
      if (roleIdx === -1) return null;

      deliberation.roles[roleIdx].analysis = analysis.text;
      deliberation.roles[roleIdx].confidence = analysis.confidence || 0.5;
      deliberation.roles[roleIdx].verdict = analysis.verdict || 'undecided';
      deliberation.roles[roleIdx].evidence = analysis.evidence || [];
      deliberation.roles[roleIdx].risks = analysis.risks || [];
      deliberation.roles[roleIdx].questions = analysis.questions || [];

      return deliberation;
    },

    /**
     * Synthesize all role analyses into a final verdict
     * @param {Object|null} deliberation - The deliberation object with all role analyses
     * @returns {Object|null} Updated deliberation object with synthesis and final_verdict, or null on invalid input
     */
    synthesize(deliberation) {
      if (!deliberation || !deliberation.roles) return null;

      const verdicts = deliberation.roles.map(r => r.verdict).filter(v => v && v !== 'undecided');
      const avgConfidence = deliberation.roles.reduce((sum, r) => sum + r.confidence, 0) / Math.max(deliberation.roles.length, 1);

      const readyCount = verdicts.filter(v => v === 'ready').length;
      const notReadyCount = verdicts.filter(v => v === 'not_ready').length;
      const conditionalCount = verdicts.filter(v => v === 'conditional').length;

      let finalState;
      if (notReadyCount > readyCount) {
        finalState = 'NOT_READY';
      } else if (readyCount > notReadyCount && conditionalCount === 0) {
        finalState = 'READY';
      } else {
        finalState = 'CONDITIONAL';
      }

      deliberation.synthesis = {
        total_roles: deliberation.roles.length,
        responses: verdicts.length,
        consensus_ready: readyCount,
        consensus_not_ready: notReadyCount,
        consensus_conditional: conditionalCount,
        avg_confidence: avgConfidence,
        disagreements: verdicts.filter((v, i, arr) => arr.indexOf(v) === i).length > 1,
        all_evidence: deliberation.roles.flatMap(r => r.evidence),
        all_risks: deliberation.roles.flatMap(r => r.risks),
        unresolved_questions: deliberation.roles.flatMap(r => r.questions)
      };

      deliberation.final_verdict = VERDICT_STATES[finalState];
      deliberation.status = 'complete';

      return deliberation;
    },

    /**
     * Save deliberation result to database
     * @param {Object|null} deliberation - The completed deliberation object with synthesis and verdict
     * @returns {Promise<boolean>} true if saved successfully, false otherwise
     */
    async saveDeliberation(deliberation) {
      if (!deliberation) return false;

      if (!window.OmegaSupabase?.sb) return false;

      const sb = window.OmegaSupabase.sb;
      const sess = await sb.auth.getSession();
      const userId = sess?.data?.session?.user?.id;
      if (!userId) return false;

      const { error } = await sb.from('council_deliberations').update({
        status: deliberation.status,
        roles_snapshot: deliberation.roles,
        synthesis: deliberation.synthesis,
        final_verdict: deliberation.final_verdict?.label ?? 'PENDING',
        completed_at: new Date().toISOString()
      }).eq('id', deliberation.id);

      if (error) {
        console.error('OmegaCouncil: Could not save deliberation', error);
        return false;
      }

      return true;
    },

    /**
     * Load past deliberations for the current user
     * @param {number} [limit=20] - Maximum number of deliberations to retrieve
     * @returns {Promise<Array>} Array of deliberation objects, or empty array on error
     */
    async loadDeliberations(limit = 20) {
      if (!window.OmegaSupabase?.sb) return [];

      const sb = window.OmegaSupabase.sb;
      const sess = await sb.auth.getSession();
      const userId = sess?.data?.session?.user?.id;
      if (!userId) return [];

      const { data, error } = await sb
        .from('council_deliberations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('OmegaCouncil: Could not load deliberations', error);
        return [];
      }

      return data ?? [];
    },

    /**
     * Get details for a specific council role
     * @param {string|null} roleKey - The role key (e.g., 'architect', 'engineer', 'security')
     * @returns {Object|undefined} Role object with title, icon, responsibility, specialty, or undefined if not found
     */
    getRole(roleKey) {
      if (!roleKey) return undefined;
      return COUNCIL_ROLES.find(r => r?.role === roleKey);
    },

    /**
     * Get all council roles
     * @returns {Array<Object>} Array of all 7 council roles with their properties
     */
    getRoles() {
      return COUNCIL_ROLES || [];
    },

    /**
     * Get verdict state definition with label, color, and description
     * @param {string|null} stateKey - The verdict state key ('READY', 'NOT_READY', 'CONDITIONAL', 'PENDING')
     * @returns {Object} Verdict state object with label, color, and description (defaults to PENDING if invalid)
     */
    getVerdictState(stateKey) {
      if (!stateKey || !VERDICT_STATES[stateKey]) {
        return VERDICT_STATES.PENDING;
      }
      return VERDICT_STATES[stateKey];
    }
  };

  // Auto-register module
  window.OmegaCouncilReady = true;
})();

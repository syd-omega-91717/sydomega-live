/* OMEGA COUNCIL – Decision & Deliberation Engine
   Multi-agent consensus system for production-readiness and high-stakes decisions.

   Architecture: Architect, Engineer, Security, Red-Team, Auditor, Researcher, Pragmatist
   Output: Structured verdict with consensus, disagreements, evidence, confidence, risks.

   NOT an oracle — value is independent perspectives, adversarial scrutiny, synthesis.
*/

(function() {
  'use strict';

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
    // Request a deliberation on a specific topic/decision
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
      try {
        if (window.OmegaSupabase?.sb) {
          const sb = window.OmegaSupabase.sb;
          const sess = await sb.auth.getSession();
          if (sess?.data?.session?.user?.id) {
            await sb.from('council_deliberations').insert({
              user_id: sess.data.session.user.id,
              subject,
              context,
              depth,
              status: 'in_progress',
              roles_snapshot: deliberation.roles,
              created_at: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.warn('OmegaCouncil: Could not record deliberation start', err);
      }

      return deliberation;
    },

    // Add a role's analysis to the deliberation
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

    // Synthesize all role analyses into a final verdict
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

    // Save deliberation result to database
    async saveDeliberation(deliberation) {
      if (!deliberation) return null;

      try {
        if (window.OmegaSupabase?.sb) {
          const sb = window.OmegaSupabase.sb;
          const sess = await sb.auth.getSession();
          if (sess?.data?.session?.user?.id) {
            await sb.from('council_deliberations').update({
              status: deliberation.status,
              roles_snapshot: deliberation.roles,
              synthesis: deliberation.synthesis,
              final_verdict: deliberation.final_verdict.label,
              completed_at: new Date().toISOString()
            }).eq('id', deliberation.id);

            return true;
          }
        }
      } catch (err) {
        console.error('OmegaCouncil: Could not save deliberation', err);
        return false;
      }

      return false;
    },

    // Load past deliberations
    async loadDeliberations(limit = 20) {
      try {
        if (window.OmegaSupabase?.sb) {
          const sb = window.OmegaSupabase.sb;
          const sess = await sb.auth.getSession();
          if (sess?.data?.session?.user?.id) {
            const { data, error } = await sb
              .from('council_deliberations')
              .select('*')
              .eq('user_id', sess.data.session.user.id)
              .order('created_at', { ascending: false })
              .limit(limit);

            if (error) throw error;
            return data || [];
          }
        }
      } catch (err) {
        console.error('OmegaCouncil: Could not load deliberations', err);
        return [];
      }

      return [];
    },

    // Get role details
    getRole(roleKey) {
      return COUNCIL_ROLES.find(r => r.role === roleKey);
    },

    // Get all roles
    getRoles() {
      return COUNCIL_ROLES;
    },

    // Get verdict state definition
    getVerdictState(stateKey) {
      return VERDICT_STATES[stateKey] || VERDICT_STATES.PENDING;
    }
  };

  // Auto-register module
  window.OmegaCouncilReady = true;
})();

// Graphify Integration Engine: Real-time activity → knowledge graph extraction
// Listens to activity_feed events, extracts entities/relationships, updates graph
// Only loads on pages that benefit from it; loads silently if no Supabase/user context

(function() {
  'use strict';

  const sb = window.OmegaSupabase?.sb;
  if (!sb) return; // Supabase not ready

  let isInitialized = false;
  let currentUser = null;
  let subscription = null;
  let lastProcessedTime = null;
  let processedEventIds = new Set(); // Dedup: don't re-process same event twice

  // Configuration
  const CONFIG = {
    confidenceThreshold: 0.75, // Only act on high-confidence extractions
    relationshipStrengthThreshold: 0.7,
    maxEventsPerSync: 10, // Process up to 10 events per real-time batch
    autoIngestInterval: 300000, // 5 minutes: auto-check for new activity periodically
    notificationThreshold: 0.85, // Notify only on very high confidence
  };

  // Initialize integration
  async function init() {
    try {
      const sess = await sb.auth.getSession();
      currentUser = sess?.data?.session?.user?.id;
      if (!currentUser) return;

      isInitialized = true;
      subscribeToActivityFeed();
      schedulePeriodicSync();

      // Log initialization (silent, no UI)
      window.OmegaGraphify = window.OmegaGraphify || {};
      window.OmegaGraphify.integrationReady = true;
    } catch (err) {
      console.error('[Graphify Integration] Init error:', err);
    }
  }

  // Subscribe to real-time activity feed updates
  function subscribeToActivityFeed() {
    if (subscription) return; // Already subscribed

    subscription = sb
      .channel(`graphify:activity_feed:${currentUser}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
          filter: `user_id=eq.${currentUser}`,
        },
        (payload) => {
          handleActivityEvent(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('[Graphify Integration] Subscribed to activity feed');
        }
      });
  }

  // Handle a new activity event: extract entities/relationships, upsert to graph
  async function handleActivityEvent(activity) {
    if (!activity?.id || processedEventIds.has(activity.id)) return;
    processedEventIds.add(activity.id);

    // Clean up old entries in the dedup set to prevent unbounded memory growth
    if (processedEventIds.size > 1000) {
      const arr = Array.from(processedEventIds);
      processedEventIds.clear();
      arr.slice(-500).forEach(id => processedEventIds.add(id));
    }

    try {
      // Skip private activities; only process public ones to avoid breaking privacy
      if (activity.is_public === false) return;

      // Extract content to analyze
      const content = [activity.title, activity.body, activity.metadata?.context]
        .filter(Boolean)
        .join(' ');

      if (!content || content.length < 10) return; // Skip trivial content

      // Call graphify-ai-query Edge Function to extract entities and relationships
      const result = await extractFromActivity(content, activity);
      if (!result) return;

      // Process extracted entities
      if (result.entities?.length > 0) {
        await processExtractedEntities(result.entities, activity);
      }

      // Process extracted relationships
      if (result.relationships?.length > 0) {
        await processExtractedRelationships(result.relationships, activity);
      }

      // Check if any results warrant a notification
      if (result.entities?.some(e => e.confidence >= CONFIG.notificationThreshold) ||
          result.relationships?.some(r => r.strength >= CONFIG.notificationThreshold)) {
        await notifySignificantFindings(result, activity);
      }

      lastProcessedTime = new Date().toISOString();
    } catch (err) {
      console.error('[Graphify Integration] Error processing activity:', err);
    }
  }

  // Call graphify-ai-query Edge Function
  async function extractFromActivity(content, activity) {
    try {
      const resp = await fetch('/functions/v1/graphify-ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser,
          query_type: 'auto_extract',
          content: content,
          source_type: 'activity_feed',
          source_id: activity.id,
        }),
      });

      if (!resp.ok) throw new Error(`Edge Function error: ${resp.status}`);

      const data = await resp.json();
      return data.extraction || null;
    } catch (err) {
      console.error('[Graphify Integration] Extract error:', err);
      return null;
    }
  }

  // Upsert extracted entities into graph_entities table
  async function processExtractedEntities(entities, activity) {
    try {
      const toUpsert = entities
        .filter(e => e.confidence >= CONFIG.confidenceThreshold)
        .map(e => ({
          user_id: currentUser,
          entity_type: e.type || 'unknown',
          canonical_name: e.name,
          display_name: e.display_name || e.name,
          description: e.description || '',
          confidence_score: e.confidence,
          verified: false,
          metadata: {
            source: 'activity_feed',
            source_activity_id: activity.id,
            first_mentioned: activity.created_at,
          },
        }));

      if (toUpsert.length === 0) return;

      const { error } = await sb
        .from('graph_entities')
        .upsert(toUpsert, { onConflict: 'user_id,canonical_name' });

      if (error) throw error;

      // Log graph event for audit trail
      await logGraphEvent('entity_auto_ingested', toUpsert[0]?.canonical_name, {
        count: toUpsert.length,
        source_activity_id: activity.id,
        confidence_avg: toUpsert.reduce((sum, e) => sum + e.confidence_score, 0) / toUpsert.length,
      });
    } catch (err) {
      console.error('[Graphify Integration] Entity upsert error:', err);
    }
  }

  // Upsert extracted relationships into graph_relationships table
  async function processExtractedRelationships(relationships, activity) {
    try {
      // First, ensure both source and target entities exist
      const entityNames = new Set();
      relationships.forEach(r => {
        entityNames.add(r.source_entity);
        entityNames.add(r.target_entity);
      });

      // Get or create stub entities for any not yet in the graph
      const entities = Array.from(entityNames).map(name => ({
        user_id: currentUser,
        entity_type: 'inferred',
        canonical_name: name,
        display_name: name,
        description: 'Auto-created from relationship extraction',
        confidence_score: 0.5, // Lower confidence for inferred entities
        verified: false,
      }));

      await sb
        .from('graph_entities')
        .upsert(entities, { onConflict: 'user_id,canonical_name' });

      // Now upsert relationships
      const toUpsert = relationships
        .filter(r => r.strength >= CONFIG.relationshipStrengthThreshold)
        .map(r => ({
          user_id: currentUser,
          source_entity_id: r.source_entity, // Will be resolved by foreign key
          target_entity_id: r.target_entity,
          relationship_type: r.type || 'related_to',
          strength_score: r.strength || 0.5,
          confidence_score: r.confidence || r.strength || 0.5,
          verified: false,
          metadata: {
            source: 'activity_feed',
            source_activity_id: activity.id,
            context: r.context || '',
          },
        }));

      if (toUpsert.length === 0) return;

      const { error } = await sb
        .from('graph_relationships')
        .upsert(toUpsert, { onConflict: 'user_id,source_entity_id,target_entity_id,relationship_type' });

      if (error) throw error;

      // Log graph event
      await logGraphEvent('relationship_auto_ingested', toUpsert[0]?.source_entity_id, {
        count: toUpsert.length,
        source_activity_id: activity.id,
        strength_avg: toUpsert.reduce((sum, r) => sum + r.strength_score, 0) / toUpsert.length,
      });
    } catch (err) {
      console.error('[Graphify Integration] Relationship upsert error:', err);
    }
  }

  // Log a graph event to the audit trail
  async function logGraphEvent(eventType, entityName, metadata) {
    try {
      await sb
        .from('graph_events')
        .insert([
          {
            user_id: currentUser,
            event_type: eventType,
            entity_name: entityName || 'system',
            metadata: metadata || {},
            created_at: new Date().toISOString(),
          },
        ]);
    } catch (err) {
      console.error('[Graphify Integration] Log error:', err);
    }
  }

  // Send notification for significant findings
  async function notifySignificantFindings(extraction, activity) {
    try {
      const entityCount = extraction.entities?.length || 0;
      const relationshipCount = extraction.relationships?.length || 0;

      const message = `Graph ingestion: ${entityCount} entity/entities, ${relationshipCount} relationship(s) extracted from activity`;

      // Use the platform's notification system if available
      if (window.OmegaNotify?.send) {
        window.OmegaNotify.send(message, 'info');
      } else {
        // Fallback: insert into notifications table if available
        await sb
          .from('notifications')
          .insert([
            {
              user_id: currentUser,
              notification_type: 'graph_significant_finding',
              message: message,
              content: {
                entities: entityCount,
                relationships: relationshipCount,
                source_activity_id: activity.id,
              },
              read_at: null,
            },
          ]);
      }
    } catch (err) {
      console.error('[Graphify Integration] Notification error:', err);
    }
  }

  // Periodic sync: check for recent activity that hasn't been processed yet
  function schedulePeriodicSync() {
    setInterval(async () => {
      try {
        if (!isInitialized || !currentUser) return;

        // Fetch recent activity not yet processed
        const since = lastProcessedTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await sb
          .from('activity_feed')
          .select('*')
          .eq('user_id', currentUser)
          .eq('is_public', true)
          .gt('created_at', since)
          .order('created_at', { ascending: false })
          .limit(CONFIG.maxEventsPerSync);

        if (error) throw error;

        // Process each activity
        for (const activity of data || []) {
          if (!processedEventIds.has(activity.id)) {
            await handleActivityEvent(activity);
          }
        }
      } catch (err) {
        console.error('[Graphify Integration] Periodic sync error:', err);
      }
    }, CONFIG.autoIngestInterval);
  }

  // Initialization: run after page load and user context is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public interface for direct control if needed
  window.OmegaGraphifyIntegration = {
    init,
    processActivity: handleActivityEvent,
    logEvent: logGraphEvent,
    isReady: () => isInitialized,
  };
})();

import axios from 'axios';
import { getClientConfig } from '@/config/clients';

export async function GET(request, { params }) {
  const { account_slug } = params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'all';

  // Get client configuration
  const clientConfig = getClientConfig(account_slug);

  if (!clientConfig) {
    return Response.json(
      { error: 'Cliente não encontrado' },
      { status: 404 }
    );
  }

  const { desk_id, api_key, tag_key, erv_variable, live_instructions, funnel_tags } = clientConfig;

  const url = `https://api.moveo.ai/api/v1/desks/${desk_id}/conversations`;
  const headers = {
    'Authorization': `apikey ${api_key}`,
    'Content-Type': 'application/json'
  };

  // Calculate date range based on period
  const endDate = new Date();
  let startDate = new Date();

  if (period === 'week') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setDate(endDate.getDate() - 30);
  } else {
    startDate.setDate(endDate.getDate() - 90);
  }

  let conversations = [];
  let nextCursor = null;
  let hasMore = true;

  try {
    while (hasMore) {
      const apiParams = {
        account_slug: clientConfig.account_slug,
        limit: 400
      };

      if (nextCursor) {
        apiParams.next_cursor = nextCursor;
      }

      const response = await axios.get(url, { headers, params: apiParams });
      const data = response.data;

      let pageConversations = data.conversations || [];
      if (!pageConversations.length && Array.isArray(data)) {
        pageConversations = data;
      }

      if (!pageConversations.length) {
        break;
      }

      for (const conv of pageConversations) {
        const createdAtStr = conv.created_time || conv.created_at || conv.inserted_at || conv.created;

        if (!createdAtStr) {
          conversations.push(conv);
          continue;
        }

        const createdAt = new Date(createdAtStr);

        if (createdAt < startDate) {
          hasMore = false;
          break;
        }

        if (createdAt <= endDate) {
          conversations.push(conv);
        }
      }

      const pagination = data.pagination || {};
      nextCursor = pagination.next_cursor;

      if (!nextCursor) {
        hasMore = false;
      }
    }

    // Process data with client-specific configuration
    const stats = processConversations(conversations, tag_key, erv_variable, live_instructions, funnel_tags);

    return Response.json({
      total: conversations.length,
      period,
      stats,
      account_slug: clientConfig.account_slug,
      config: {
        tag_key,
        erv_variable,
        display_name: clientConfig.display_name
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Erro ao buscar conversas' },
      { status: 500 }
    );
  }
}

function processConversations(conversations, tagKey, ervVariable, live_instructions, funnel_tags) {

  // Initialize stats
  const interactionBuckets = {
    total: { count: 0, total_erv: 0.0, human_attendance: 0 },
    more_than_3: { count: 0, total_erv: 0.0, human_attendance: 0 },
    more_than_5: { count: 0, total_erv: 0.0, human_attendance: 0 },
    more_than_7: { count: 0, total_erv: 0.0, human_attendance: 0 },
    more_than_10: { count: 0, total_erv: 0.0, human_attendance: 0 }
  };

  // Linear interaction data (by exact count)
  const linearInteractions = {};
  const linearInteractionsTagKey = {};

  const tagStats = {};
  funnel_tags.forEach(tag => {
    tagStats[tag] = {
      total: { count: 0, total_erv: 0.0, human_attendance: 0 },
      more_than_3: { count: 0, total_erv: 0.0, human_attendance: 0 },
      more_than_5: { count: 0, total_erv: 0.0, human_attendance: 0 },
      more_than_7: { count: 0, total_erv: 0.0, human_attendance: 0 },
      more_than_10: { count: 0, total_erv: 0.0, human_attendance: 0 }
    };
  });

  // Tag presence statistics
  const tagPresence = {};
  funnel_tags.forEach(tag => {
    tagPresence[tag] = { count: 0, total_erv: 0.0 };
  });
  tagPresence.sem_tags = { count: 0, total_erv: 0.0 };

  conversations.forEach(conv => {
    const msgCount = conv.message_count || 0;

    // Extract ERV using the client-specific variable name
    let ervStr = '0';
    const context = conv.context || {};
    if (!live_instructions) {
    const liveInstructions = context.live_instructions || {};
      ervStr = liveInstructions[ervVariable] || '0';
    } else {
      ervStr = context[ervVariable] || '0';
    }

    let ervVal = 0.0;
    try {
      const ervClean = ervStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      ervVal = parseFloat(ervClean) || 0.0;
    } catch (e) {
      ervVal = 0.0;
    }

    // Check if has human attendance
    const hasHumanAttendance = conv.assignee_agent_id !== null && conv.assignee_agent_id !== undefined;

    // Total conversations
    interactionBuckets.total.count += 1;
    interactionBuckets.total.total_erv += ervVal;
    if (hasHumanAttendance) {
      interactionBuckets.total.human_attendance += 1;
    }

    // Linear interaction data
    const interactionKey = msgCount > 20 ? '21+' : msgCount.toString();
    if (!linearInteractions[interactionKey]) {
      linearInteractions[interactionKey] = { count: 0, total_erv: 0.0, human_attendance: 0 };
    }
    linearInteractions[interactionKey].count += 1;
    linearInteractions[interactionKey].total_erv += ervVal;
    if (hasHumanAttendance) {
      linearInteractions[interactionKey].human_attendance += 1;
    }

    // Interaction buckets
    if (msgCount > 3) {
      interactionBuckets.more_than_3.count += 1;
      interactionBuckets.more_than_3.total_erv += ervVal;
      if (hasHumanAttendance) {
        interactionBuckets.more_than_3.human_attendance += 1;
      }
    }
    if (msgCount > 5) {
      interactionBuckets.more_than_5.count += 1;
      interactionBuckets.more_than_5.total_erv += ervVal;
      if (hasHumanAttendance) {
        interactionBuckets.more_than_5.human_attendance += 1;
      }
    }
    if (msgCount > 7) {
      interactionBuckets.more_than_7.count += 1;
      interactionBuckets.more_than_7.total_erv += ervVal;
      if (hasHumanAttendance) {
        interactionBuckets.more_than_7.human_attendance += 1;
      }
    }
    if (msgCount > 10) {
      interactionBuckets.more_than_10.count += 1;
      interactionBuckets.more_than_10.total_erv += ervVal;
      if (hasHumanAttendance) {
        interactionBuckets.more_than_10.human_attendance += 1;
      }
    }

    // Tag analysis
    const tags = context.tags || [];
    let hasAnyTag = false;
    let hasTagKey = false;

    tags.forEach(tag => {
      if (funnel_tags.includes(tag)) {
        hasAnyTag = true;

        // Check if it's the client-specific tag key
        if (tag === tagKey) {
          hasTagKey = true;
        }

        // Tag presence count
        tagPresence[tag].count += 1;
        tagPresence[tag].total_erv += ervVal;

        tagStats[tag].total.count += 1;
        tagStats[tag].total.total_erv += ervVal;
        if (hasHumanAttendance) {
          tagStats[tag].total.human_attendance += 1;
        }

        if (msgCount > 3) {
          tagStats[tag].more_than_3.count += 1;
          tagStats[tag].more_than_3.total_erv += ervVal;
          if (hasHumanAttendance) {
            tagStats[tag].more_than_3.human_attendance += 1;
          }
        }
        if (msgCount > 5) {
          tagStats[tag].more_than_5.count += 1;
          tagStats[tag].more_than_5.total_erv += ervVal;
          if (hasHumanAttendance) {
            tagStats[tag].more_than_5.human_attendance += 1;
          }
        }
        if (msgCount > 7) {
          tagStats[tag].more_than_7.count += 1;
          tagStats[tag].more_than_7.total_erv += ervVal;
          if (hasHumanAttendance) {
            tagStats[tag].more_than_7.human_attendance += 1;
          }
        }
        if (msgCount > 10) {
          tagStats[tag].more_than_10.count += 1;
          tagStats[tag].more_than_10.total_erv += ervVal;
          if (hasHumanAttendance) {
            tagStats[tag].more_than_10.human_attendance += 1;
          }
        }
      }
    });

    // Linear interaction data for the client-specific tag key
    if (hasTagKey) {
      const interactionKey = msgCount > 20 ? '21+' : msgCount.toString();
      if (!linearInteractionsTagKey[interactionKey]) {
        linearInteractionsTagKey[interactionKey] = { count: 0, total_erv: 0.0, human_attendance: 0 };
      }
      linearInteractionsTagKey[interactionKey].count += 1;
      linearInteractionsTagKey[interactionKey].total_erv += ervVal;
      if (hasHumanAttendance) {
        linearInteractionsTagKey[interactionKey].human_attendance += 1;
      }
    }

    // Count conversations without any of the specified tags
    if (!hasAnyTag) {
      tagPresence.sem_tags.count += 1;
      tagPresence.sem_tags.total_erv += ervVal;
    }
  });

  // Calculate averages
  const calculateAverage = (bucket) => {
    return bucket.count > 0 ? bucket.total_erv / bucket.count : 0;
  };

  // Calculate "more than N interactions" cumulative data
  const allInteractionCounts = Object.keys(linearInteractions)
    .map(key => key === '21+' ? 21 : parseInt(key))
    .sort((a, b) => a - b);

  // Calculate cumulative counts for "more than N interactions"
  const linearInteractionsArray = [];
  const maxInteractions = allInteractionCounts.length > 0
    ? Math.max(...allInteractionCounts)
    : 0;

  for (let n = 0; n <= maxInteractions; n++) {
    let count = 0;
    let total_erv = 0;
    let human_attendance = 0;

    // Sum all conversations with > n interactions
    Object.entries(linearInteractions).forEach(([key, data]) => {
      const interactionCount = key === '21+' ? 21 : parseInt(key);
      if (interactionCount > n) {
        count += data.count;
        total_erv += data.total_erv;
        human_attendance += data.human_attendance || 0;
      }
    });

    if (count > 0) {
      linearInteractionsArray.push({
        interactions: n,
        label: n.toString(),
        count,
        total_erv,
        avg_erv: count > 0 ? total_erv / count : 0,
        human_attendance
      });
    }
  }

  // Calculate "more than N interactions" for the client-specific tag key
  const linearInteractionsTagKeyArray = [];
  const allTagKeyCounts = Object.keys(linearInteractionsTagKey)
    .map(key => key === '21+' ? 21 : parseInt(key))
    .sort((a, b) => a - b);
  const maxTagKeyInteractions = allTagKeyCounts.length > 0
    ? Math.max(...allTagKeyCounts)
    : 0;

  for (let n = 0; n <= maxTagKeyInteractions; n++) {
    let count = 0;
    let total_erv = 0;
    let human_attendance = 0;

    // Sum all conversations with > n interactions
    Object.entries(linearInteractionsTagKey).forEach(([key, data]) => {
      const interactionCount = key === '21+' ? 21 : parseInt(key);
      if (interactionCount > n) {
        count += data.count;
        total_erv += data.total_erv;
        human_attendance += data.human_attendance || 0;
      }
    });

    if (count > 0) {
      linearInteractionsTagKeyArray.push({
        interactions: n,
        label: n.toString(),
        count,
        total_erv,
        avg_erv: count > 0 ? total_erv / count : 0,
        human_attendance
      });
    }
  }

  // Calculate tag presence percentages
  const totalConversations = interactionBuckets.total.count;
  const tagPresenceStats = Object.entries(tagPresence).map(([tag, data]) => ({
    tag,
    count: data.count,
    total_erv: data.total_erv,
    avg_erv: calculateAverage(data),
    percentage: totalConversations > 0 ? (data.count / totalConversations) * 100 : 0
  }));

  return {
    interactions: {
      total: {
        ...interactionBuckets.total,
        avg_erv: calculateAverage(interactionBuckets.total),
        human_attendance_percentage: interactionBuckets.total.count > 0
          ? (interactionBuckets.total.human_attendance / interactionBuckets.total.count) * 100
          : 0
      },
      more_than_3: {
        ...interactionBuckets.more_than_3,
        avg_erv: calculateAverage(interactionBuckets.more_than_3),
        human_attendance_percentage: interactionBuckets.more_than_3.count > 0
          ? (interactionBuckets.more_than_3.human_attendance / interactionBuckets.more_than_3.count) * 100
          : 0
      },
      more_than_5: {
        ...interactionBuckets.more_than_5,
        avg_erv: calculateAverage(interactionBuckets.more_than_5),
        human_attendance_percentage: interactionBuckets.more_than_5.count > 0
          ? (interactionBuckets.more_than_5.human_attendance / interactionBuckets.more_than_5.count) * 100
          : 0
      },
      more_than_7: {
        ...interactionBuckets.more_than_7,
        avg_erv: calculateAverage(interactionBuckets.more_than_7),
        human_attendance_percentage: interactionBuckets.more_than_7.count > 0
          ? (interactionBuckets.more_than_7.human_attendance / interactionBuckets.more_than_7.count) * 100
          : 0
      },
      more_than_10: {
        ...interactionBuckets.more_than_10,
        avg_erv: calculateAverage(interactionBuckets.more_than_10),
        human_attendance_percentage: interactionBuckets.more_than_10.count > 0
          ? (interactionBuckets.more_than_10.human_attendance / interactionBuckets.more_than_10.count) * 100
          : 0
      },
      linear: linearInteractionsArray
    },
    tagPresence: tagPresenceStats,
    tagKeyLinear: linearInteractionsTagKeyArray,
    tags: Object.fromEntries(
      Object.entries(tagStats).map(([tag, buckets]) => [
        tag,
        {
          total: {
            ...buckets.total,
            avg_erv: calculateAverage(buckets.total),
            human_attendance_percentage: buckets.total.count > 0
              ? (buckets.total.human_attendance / buckets.total.count) * 100
              : 0
          },
          more_than_3: {
            ...buckets.more_than_3,
            avg_erv: calculateAverage(buckets.more_than_3),
            human_attendance_percentage: buckets.more_than_3.count > 0
              ? (buckets.more_than_3.human_attendance / buckets.more_than_3.count) * 100
              : 0
          },
          more_than_5: {
            ...buckets.more_than_5,
            avg_erv: calculateAverage(buckets.more_than_5),
            human_attendance_percentage: buckets.more_than_5.count > 0
              ? (buckets.more_than_5.human_attendance / buckets.more_than_5.count) * 100
              : 0
          },
          more_than_7: {
            ...buckets.more_than_7,
            avg_erv: calculateAverage(buckets.more_than_7),
            human_attendance_percentage: buckets.more_than_7.count > 0
              ? (buckets.more_than_7.human_attendance / buckets.more_than_7.count) * 100
              : 0
          },
          more_than_10: {
            ...buckets.more_than_10,
            avg_erv: calculateAverage(buckets.more_than_10),
            human_attendance_percentage: buckets.more_than_10.count > 0
              ? (buckets.more_than_10.human_attendance / buckets.more_than_10.count) * 100
              : 0
          }
        }
      ])
    )
  };
}

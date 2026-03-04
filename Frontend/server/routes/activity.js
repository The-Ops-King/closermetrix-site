/**
 * ACTIVITY ROUTES — /api/activity/*
 *
 * Tracks client dashboard usage: logins, page views, time on page.
 * All routes require clientIsolation middleware (X-Client-Token header).
 *
 * Fire-and-forget: inserts are not awaited, response returns immediately.
 * Only tracks real client/partner views — admin views are skipped.
 *
 * Routes:
 *   POST /api/activity/session-start  — Log a new session (login)
 *   POST /api/activity/page-view      — Log a page visit with optional duration
 */

const express = require('express');
const crypto = require('crypto');
const { insertActivity } = require('../db/queries/activityLog');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/activity/session-start
 *
 * Called once when the client dashboard loads.
 * Body: { sessionId: string }
 */
router.post('/session-start', (req, res) => {
  // Skip tracking for admin views
  if (req.isAdmin) {
    return res.json({ success: true });
  }

  const { sessionId } = req.body || {};

  // Fire-and-forget — don't await
  insertActivity({
    activityId: crypto.randomUUID(),
    clientId: req.clientId,
    eventType: 'session_start',
    page: '',
    sessionId: sessionId || '',
    durationSeconds: 0,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    userAgent: req.headers['user-agent'] || '',
  }).catch(err => {
    logger.warn('session-start activity insert failed', { error: err.message });
  });

  res.json({ success: true });
});

/**
 * POST /api/activity/page-view
 *
 * Called on each page navigation.
 * Body: { sessionId: string, page: string, durationSeconds?: number }
 *
 * durationSeconds is the time spent on the PREVIOUS page (sent when navigating away).
 */
router.post('/page-view', (req, res) => {
  // Skip tracking for admin views
  if (req.isAdmin) {
    return res.json({ success: true });
  }

  const { sessionId, page, durationSeconds } = req.body || {};

  // Fire-and-forget
  insertActivity({
    activityId: crypto.randomUUID(),
    clientId: req.clientId,
    eventType: 'page_view',
    page: page || '',
    sessionId: sessionId || '',
    durationSeconds: durationSeconds || 0,
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    userAgent: req.headers['user-agent'] || '',
  }).catch(err => {
    logger.warn('page-view activity insert failed', { error: err.message });
  });

  res.json({ success: true });
});

module.exports = router;

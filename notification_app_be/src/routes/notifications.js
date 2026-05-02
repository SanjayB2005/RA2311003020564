const express = require('express');
const { Op } = require('sequelize');
const { Notification } = require('../db');
const NodeCache = require('node-cache');

const router = express.Router();
const myCache = new NodeCache({ stdTTL: 10, checkperiod: 12 });

/**
 * GET /notifications
 * Stage 4: Pagination Implementation
 * Stage 4: Database load reduction techniques -> node-cache
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const cacheKey = `notifs_${page}_${limit}`;
        const cachedResponse = myCache.get(cacheKey);

        if (cachedResponse) {
            return res.json(cachedResponse);
        }

        const { count, rows } = await Notification.findAndCountAll({
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        const response = {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            notifications: rows
        };

        myCache.set(cacheKey, response); // Cache setup

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /notifications/priority
 * Stage 6: Efficient Top-N Selection
 * Stage 3: Optimized query selecting (Impact + Recency calculated offline/sorting)
 */
router.get('/priority', async (req, res) => {
    try {
        const limit = req.query.limit || 5;

        // Formula: Impact desc, CreatedAt desc 
        // This calculates Priority by Impact AND Recency in the DB query
        const topNotifications = await Notification.findAll({
            where: { status: 'unread' },
            order: [
                ['impact', 'DESC'],     // Impact check
                ['createdAt', 'DESC']   // Recency check
            ],
            limit: parseInt(limit)
        });

        res.json({ topItems: topNotifications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /notifications/recent
 * Stage 3: The "last 7 days placement" query implementation
 */
router.get('/recent', async (req, res) => {
    try {
        const Last7Days = new Date(new Date().setDate(new Date().getDate() - 7));
        
        const recents = await Notification.findAll({
            where: {
                createdAt: {
                    [Op.gte]: Last7Days
                }
            }
        });

        res.json({ count: recents.length, items: recents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Stage 1: Async update API
 * POST /notifications/:id/read
 */
router.post('/:id/read', async (req, res) => {
    try {
        await Notification.update({ status: 'read' }, { where: { id: req.params.id } });
        res.json({ success: true, message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
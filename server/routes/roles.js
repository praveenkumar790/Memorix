const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createRoleSchema, getRolesSchema } = require('../utils/validationSchemas');

// GET /api/roles?companyId=xxx - List all roles for a company
router.get('/', authMiddleware, validate(getRolesSchema), async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({ error: 'companyId is required' });
        }

        // Verify user has access to this company
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('user_id', req.user.id)
            .single();

        if (profile?.company_id !== companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { data: roles, error } = await supabase
            .from('roles')
            .select('*')
            .eq('company_id', companyId)
            .order('name');

        if (error) throw error;

        res.json(roles || []);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/roles - Create a new role
router.post('/', authMiddleware, validate(createRoleSchema), async (req, res) => {
    try {
        const { companyId, name } = req.body;

        if (!companyId || !name) {
            return res.status(400).json({ error: 'companyId and name are required' });
        }

        // Verify user has access to this company
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('user_id', req.user.id)
            .single();

        if (profile?.company_id !== companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { data: role, error } = await supabase
            .from('roles')
            .insert({ company_id: companyId, name })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(409).json({ error: 'Role already exists' });
            }
            throw error;
        }

        res.status(201).json(role);
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

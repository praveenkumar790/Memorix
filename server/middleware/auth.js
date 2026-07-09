const supabase = require('../config/supabase');
const { getCache, setCache } = require('../config/redis');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Auth Error:", error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const cacheKey = `cache:profile:user:${user.id}`;
    const cachedProfile = await getCache(cacheKey);

    if (cachedProfile) {
      req.user = cachedProfile;
      return next();
    }

    // Fetch user profile to get company_id and workspace_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        workspaces (
          id,
          name
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile Fetch Error:", profileError);
       // For now, strict: must have profile
       return res.status(403).json({ error: 'User profile not found' });
    }

    // Fetch company details to get company name
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single();

    if (companyError) {
      console.error("Company Fetch Error:", companyError);
    }

    // Attach user and company/workspace info to request
    const userPayload = {
      id: user.id,
      email: user.email,
      full_name: profile.full_name || user.email.split('@')[0], // Fallback to email username
      company_id: profile.company_id,
      company_name: company?.name || 'company', // Fallback to 'company' if not found
      workspace_id: profile.workspace_id,
      workspace_name: profile.workspaces?.name,
      role: profile.role // Now just a text label
    };

    req.user = userPayload;

    // Cache the payload for 1 hour
    await setCache(cacheKey, userPayload, 3600);

    next();
  } catch (err) {
    console.error("Middleware Error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = authMiddleware;

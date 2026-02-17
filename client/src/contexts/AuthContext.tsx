import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

type Profile = {
    id: string;
    company_id: string;
    role_id: string;
    role_name?: string;  // From JOIN with roles table
    full_name: string;
    created_at: string;
};

type Company = {
    id: string;
    name: string;
    created_at: string;
};

type AuthContextType = {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    company: Company | null;
    isLoading: boolean;
    signUp: (email: string, password: string, fullName: string, companyName: string, roleName: string) => Promise<{ needsConfirmation: boolean; email: string } | undefined>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Guard to prevent duplicate loadUserData calls
    const loadingUserRef = useRef<string | null>(null);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData(session.user.id);
            } else {
                setProfile(null);
                setCompany(null);
                loadingUserRef.current = null; // Reset guard on logout
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserData = async (userId: string) => {
        // Prevent duplicate calls for the same user
        if (loadingUserRef.current === userId) {
            console.log('⏭️ loadUserData already in progress for user:', userId);
            return;
        }
        loadingUserRef.current = userId;
        
        try {
            // Load profile with roles JOIN for role_name
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    roles (id, name)
                `)
                .eq('id', userId)
                .single();

            // If profile doesn't exist, this might be a newly confirmed user
            // Create the company and profile now
            if (profileError && profileError.code === 'PGRST116') {
                console.log('🟡 STEP 1: Profile not found - creating company and profile for confirmed user');
                
                // Get user metadata (stored during signup)
                const { data: { user } } = await supabase.auth.getUser();
                const fullName = user?.user_metadata?.full_name || 'User';
                const companyName = user?.user_metadata?.company_name || 'My Company';
                const roleName = user?.user_metadata?.role_name || 'Admin';  // Get role from metadata
                
                console.log('🟡 STEP 2: User metadata:', { fullName, companyName, roleName, user_id: userId });

                // Find or create company (case-insensitive)
                let companyId: string;
                console.log('🟡 STEP 3: Looking up company:', companyName);
                const { data: existingCompany, error: companyLookupError } = await supabase
                    .from('companies')
                    .select('id')
                    .ilike('name', companyName)
                    .maybeSingle();

                if (companyLookupError) throw companyLookupError;

                if (existingCompany) {
                    companyId = existingCompany.id;
                    console.log('🟡 STEP 4: Found existing company:', companyId);
                } else {
                    const { data: companyData, error: companyError } = await supabase
                        .from('companies')
                        .insert({ name: companyName })
                        .select()
                        .single();

                    if (companyError) {
                        console.error('❌ STEP 4 FAILED: Error creating company:', companyError);
                        throw companyError;
                    }
                    companyId = companyData.id;
                    console.log('🟡 STEP 4: Created new company:', companyId);
                }

                // Find or create role (to prevent unique constraint violations)
                let roleId: string;
                console.log('🟡 STEP 5: Looking up role:', { companyId, roleName });
                const { data: existingRole, error: roleLookupError } = await supabase
                    .from('roles')
                    .select('id')
                    .eq('company_id', companyId)
                    .eq('name', roleName)
                    .maybeSingle();

                if (roleLookupError) throw roleLookupError;

                if (existingRole) {
                    roleId = existingRole.id;
                    console.log('✅ PROFILE (Confirm): Found existing role:', existingRole);
                } else {
                    const { data: roleData, error: roleError } = await supabase
                        .from('roles')
                        .insert({ company_id: companyId, name: roleName })
                        .select()
                        .single();

                    if (roleError) {
                        console.error('❌ PROFILE (Confirm): Error creating role:', roleError);
                        throw roleError;
                    }
                    roleId = roleData.id;
                    console.log('✅ PROFILE (Confirm): Created new role:', roleData);
                }
                console.log('🟡 STEP 6: Role resolved, roleId =', roleId);

                // Create profile with role_id
                console.log('🟡 STEP 7: Creating profile with:', { userId, companyId, roleId, fullName });
                const { data: newProfileData, error: newProfileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        company_id: companyId,
                        role_id: roleId, // Fixed: use roleId, not roleData.id
                        full_name: fullName,
                    })
                    .select()
                    .single();

                if (newProfileError) {
                    console.error('❌ STEP 8 FAILED: Error creating profile:', newProfileError);
                    throw newProfileError;
                }

                console.log('✅ STEP 8: Profile created successfully:', newProfileData);

                // Fetch company for state
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', companyId)
                    .single();

                setProfile({
                    ...newProfileData,
                    role_name: roleName  // Use actual role from metadata
                });
                setCompany(companyData);
                setIsLoading(false);
                return;
            }

            if (profileError) throw profileError;
            
            // Set profile with role_name from JOIN
            setProfile({
                ...profileData,
                role_name: profileData.roles?.name
            });

            // Load company
            if (profileData?.company_id) {
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', profileData.company_id)
                    .single();

                if (companyError) throw companyError;
                setCompany(companyData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (email: string, password: string, fullName: string, companyName: string, roleName: string) => {
        try {
            // 1. Sign up user with Supabase Auth
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                    data: {
                        full_name: fullName,
                        company_name: companyName,
                        role_name: roleName  // Store for email confirmation flow
                    }
                }
            });

            // Handle rate limit specifically - account is created but email won't send
            if (signUpError && signUpError.message.includes('rate limit')) {
                // Account likely created, show confirmation screen anyway
                return { needsConfirmation: true, email };
            }

            if (signUpError) throw signUpError;
            if (!authData.user) throw new Error('No user returned from signup');

            // Check if email confirmation is required
            const needsConfirmation = authData.session === null && authData.user.confirmation_sent_at !== null;

            // If email confirmation is needed, show confirmation page immediately
            // Company and profile will be created after email is confirmed
            if (needsConfirmation) {
                return { needsConfirmation: true, email };
            }

            // No confirmation needed - find/create company, role, and profile now
            // 2. Find or create company (case-insensitive to prevent duplicates)
            let companyId: string;
            const { data: existingCompany, error: companyLookupError } = await supabase
                .from('companies')
                .select('id')
                .ilike('name', companyName)  // Case-insensitive search
                .maybeSingle();               // Returns null if not found, doesn't throw

            if (companyLookupError) throw companyLookupError;

            if (existingCompany) {
                companyId = existingCompany.id;
            } else {
                const { data: newCompany, error: companyError } = await supabase
                    .from('companies')
                    .insert({ name: companyName })
                    .select()
                    .single();

                if (companyError) throw companyError;
                companyId = newCompany.id;
            }

            // 3. Find or create role
            let roleId: string;
            const { data: existingRole, error: roleLookupError } = await supabase
                .from('roles')
                .select('id')
                .eq('company_id', companyId)
                .eq('name', roleName)
                .maybeSingle(); // Use maybeSingle to avoid error when role doesn't exist

            if (roleLookupError) throw roleLookupError;

            if (existingRole) {
                roleId = existingRole.id;
                console.log('✅ SIGNUP: Found existing role:', existingRole);
            } else {
                console.log('🔵 SIGNUP: Creating new role:', { company_id: companyId, name: roleName });
                const { data: newRole, error: roleError } = await supabase
                    .from('roles')
                    .insert({ company_id: companyId, name: roleName })
                    .select()
                    .single();

                if (roleError) {
                    console.error('❌ SIGNUP: Role creation failed:', roleError);
                    throw roleError;
                }
                console.log('✅ SIGNUP: Role created successfully:', newRole);
                roleId = newRole.id;
            }

            // 4. Create profile with role
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    company_id: companyId,
                    role_id: roleId,
                    full_name: fullName,
                });

            if (profileError) throw profileError;

            // Return status
            return { needsConfirmation: false, email };
        } catch (error: any) {
            console.error('Signup error:', error);
            throw new Error(error.message || 'Failed to sign up');
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Failed to sign in');
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            setProfile(null);
            setCompany(null);
        } catch (error: any) {
            console.error('Logout error:', error);
            throw new Error(error.message || 'Failed to sign out');
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, company, isLoading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

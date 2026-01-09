import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    userRole: 'admin' | 'team' | null;
    loading: boolean;
    signInWithEmail: (email: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    userRole: null,
    loading: true,
    signInWithEmail: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'admin' | 'team' | null>(null);
    const [loading, setLoading] = useState(true);

    const checkUserRole = async (uid: string) => {
        // Check Admin
        const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('user_id', uid)
            .single();

        if (adminData) {
            setUserRole('admin');
            return;
        }

        // Check Team
        const { data: teamData } = await supabase
            .from('teams')
            .select('id')
            .eq('user_id', uid)
            .single();

        if (teamData) {
            setUserRole('team');
            return;
        }

        setUserRole(null);
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkUserRole(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkUserRole(session.user.id).then(() => setLoading(false));
            } else {
                setUserRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        session,
        user,
        userRole,
        loading,
        signInWithEmail: async (email: string) => ({ error: null }),
        signOut: async () => {
            setUserRole(null);
            return await supabase.auth.signOut();
        },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

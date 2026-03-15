import { Redirect } from 'expo-router';
import { useUser } from '@/context/UserContext';

export default function Index() {
    const { user, isLoading, hasCompletedOnboarding } = useUser();

    if (isLoading) return null;

    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    if (hasCompletedOnboarding) {
        return <Redirect href="/auth/login" />;
    }

    return <Redirect href="/auth/onboarding" />;
}

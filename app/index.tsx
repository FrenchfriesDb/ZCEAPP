import { Redirect } from 'expo-router';
import { useUser } from '@/context/UserContext';

export default function Index() {
    const { user, isLoading } = useUser();

    if (isLoading) return null;

    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/auth/onboarding" />;
}

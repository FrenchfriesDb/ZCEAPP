import { ExpoRoot } from 'expo-router';

export default function App() {
	const req = require as NodeRequire & { context: (path: string) => any };
	const ctx = req.context('./app');
	return <ExpoRoot context={ctx} />;
}

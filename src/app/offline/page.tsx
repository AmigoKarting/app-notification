export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl">📡</p>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Hors ligne</h1>
      <p className="mt-2 text-neutral-600">
        Vous êtes actuellement hors ligne. Vérifiez votre connexion Internet.
      </p>
    </div>
  );
}

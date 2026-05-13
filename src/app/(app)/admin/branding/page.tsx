import { Card, LinkButton, PageHeader } from "@/components/ui";
import { getAppSettings } from "@/domain/branding/repository";
import { BrandingForm } from "./branding-form";

export const dynamic = "force-dynamic";

export default async function AdminBrandingPage() {
  const settings = await getAppSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marque"
        description="Personnalise le nom et le logo de l'application. Idéal pour le white-label."
        action={
          <LinkButton href="/admin" variant="secondary">
            Retour
          </LinkButton>
        }
      />

      <Card className="p-6">
        <BrandingForm
          initial={{
            app_name: settings.app_name,
            app_tagline: settings.app_tagline,
            logo_url: settings.logo_url,
          }}
        />
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">À propos du branding</h2>
        <ul className="space-y-1 text-sm text-neutral-600">
          <li>• Le logo apparaît dans le header de l'app, sur la page de connexion et sur la landing publique.</li>
          <li>• Le nom remplace "App Notification" partout dans l'interface.</li>
          <li>• La couleur d'accent se règle dans <strong>Réglages → Apparence</strong> (par utilisateur, mémorisée dans le navigateur).</li>
          <li>• Le branding ici est <strong>global</strong> à toute l'installation — tous les utilisateurs le voient.</li>
        </ul>
      </Card>
    </div>
  );
}

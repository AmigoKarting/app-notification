import { Callout, GuideNav, GuidePage, GuideSection, Path } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideFormattingPage() {
  return (
    <GuidePage
      title="Mise en forme et variables"
      description="Markdown supporté, et personnalisation par destinataire."
    >
      <GuideSection title="Mettre en forme avec Markdown">
        <p>
          Le champ <strong>Message</strong> d'une notification, d'une planification ou d'un modèle
          supporte un Markdown léger.
        </p>
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <code className="text-xs">{"**texte en gras**"}</code>
            <p>
              → <strong>texte en gras</strong>
            </p>
            <code className="text-xs">{"*texte en italique*"}</code>
            <p>
              → <em>texte en italique</em>
            </p>
            <code className="text-xs">{"`code`"}</code>
            <p>
              →{" "}
              <code className="rounded bg-neutral-100 px-1">code</code>
            </p>
            <code className="text-xs">{"[texte cliquable](https://exemple.com)"}</code>
            <p>
              → <span className="text-brand-700 underline">texte cliquable</span>
            </p>
            <code className="text-xs">{"https://exemple.com"}</code>
            <p>→ auto-converti en lien cliquable</p>
          </div>
        </div>
        <p>Les sauts de ligne dans ton message sont préservés.</p>
        <Callout type="info">
          Aucun HTML brut n'est interprété — tout est échappé en sécurité avant le rendu Markdown.
          Tu ne peux donc pas casser la mise en page de l'app, et personne ne peut injecter de
          contenu malveillant via une notification.
        </Callout>
      </GuideSection>

      <GuideSection title="Personnaliser avec des variables">
        <p>
          Pour les envois <strong>externes</strong> (email, SMS), tu peux insérer des variables qui
          seront remplacées par les informations du destinataire au moment de l'envoi.
        </p>
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <code className="text-xs">{"{name}"}</code>
            <p>→ nom affiché du destinataire (fallback email)</p>
            <code className="text-xs">{"{email}"}</code>
            <p>→ son adresse email</p>
          </div>
        </div>
        <p>
          Exemple de titre : <code className="rounded bg-neutral-100 px-1">Bonjour {"{name}"}, ta livraison arrive demain</code>
          {" "}— chaque destinataire recevra son propre prénom.
        </p>
        <Callout type="warn">
          Les variables <strong>n'ont aucun effet dans le fil in-app</strong> — le même contenu y
          est affiché à tous les destinataires (sinon ça créerait un message par utilisateur,
          ingérable). Elles servent uniquement à personnaliser les emails/SMS envoyés en plus.
        </Callout>
      </GuideSection>

      <GuideSection title="Où ça marche ?">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <Path>Admin → Notifications → Nouvelle</Path> · champ Message
          </li>
          <li>
            <Path>Admin → Planifications → Nouvelle</Path> · champ Message
          </li>
          <li>
            <Path>Admin → Modèles → Nouveau</Path> · champ Message
          </li>
        </ul>
        <p>
          Dans chaque formulaire, un petit « 💡 Mise en forme et variables disponibles » sous le
          champ Message rappelle la syntaxe en un clic.
        </p>
      </GuideSection>

      <GuideNav current="/admin/aide/mise-en-forme" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}

import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideSessionsPage() {
  return (
    <GuidePage
      title="Sessions (périodes)"
      description="Faire varier le contenu visible selon la saison ou la période."
    >
      <GuideSection title="C'est quoi une session ?">
        <p>
          Une <strong>session</strong> est une période de temps (date début → date fin) avec un nom et un état actif/inactif.
          Elle sert à <strong>contrôler quand une notification ou une planification est en vigueur</strong>.
        </p>
        <p>
          Exemples : <em>Été 2026</em> (1er juin → 31 août), <em>Onboarding semaine 1</em>, <em>Black Friday</em>,
          <em>Période d'examens</em>.
        </p>
      </GuideSection>

      <GuideSection title="Comment ça marche">
        <p>Une session a 3 dimensions qui combinent :</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Active / Désactivée</strong> — toggle manuel par le dev.</li>
          <li><strong>Date de début</strong> — la session ne s'applique pas avant.</li>
          <li><strong>Date de fin</strong> — la session ne s'applique plus après.</li>
        </ul>
        <p>Une notif rattachée à une session est visible <strong>SI</strong> :</p>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-800">
          session.active = vrai <strong>ET</strong> aujourd'hui entre starts_at et ends_at
        </div>
        <p>Dès qu'une de ces conditions n'est plus vraie, la notif disparaît du fil.</p>
      </GuideSection>

      <GuideSection title="Créer une session">
        <Steps>
          <Step number={1} title="Crée d'abord une catégorie">
            Une session appartient toujours à une catégorie. Si tu n'en as pas encore, va sur <Path>Catégories</Path>.
          </Step>
          <Step number={2} title="Va sur Sessions">
            Sidebar → <Path>Sessions</Path> → « Nouvelle session ».
          </Step>
          <Step number={3} title="Catégorie + Slug + Nom">
            Choisis la catégorie parente, donne un slug (<code>ete-2026</code>) et un nom lisible (« Été 2026 »).
          </Step>
          <Step number={4} title="Dates de début et fin">
            Définis la fenêtre temporelle. Tu peux laisser large (ex: 1 an).
          </Step>
          <Step number={5} title="Coche « Active »">
            Si décoché, la session ne s'applique pas, même pendant sa période.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="Rattacher une notif / planif à une session">
        <p>
          Dans le formulaire d'une notification ou d'une planification, va dans la section <em>Classement</em>,
          champ <strong>Période</strong>. Choisis ta session dans la liste.
        </p>
        <p>
          Si tu laisses <em>Toujours visible</em>, la notif est globale et n'est pas affectée par les sessions.
        </p>
      </GuideSection>

      <GuideSection title="Activer / Désactiver">
        <p>
          Sur la liste <Path>Sessions</Path>, chaque ligne a un badge cliquable qui bascule entre :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Désactivée</strong> (gris) — la session est coupée, peu importe les dates.</li>
          <li><strong>En cours</strong> (vert) — active ET aujourd'hui dans la fenêtre.</li>
          <li><strong>Hors période</strong> (ambre) — active mais hors fenêtre (trop tôt ou trop tard).</li>
        </ul>
        <Callout type="tip">
          Désactiver une session est non-destructif. Tes notifications restent en base, elles sont juste masquées.
          Réactiver les fait réapparaître.
        </Callout>
      </GuideSection>

      <GuideSection title="Effet sur les planifications">
        <p>
          Si une planification est rattachée à une session inactive, <strong>elle n'envoie rien</strong> tant que la
          session reste inactive. Le compteur d'occurrences avance quand même (pour ne pas accumuler des retards),
          et les envois reprennent dès la réactivation.
        </p>
      </GuideSection>

      <GuideNav current="/admin/aide/sessions" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}

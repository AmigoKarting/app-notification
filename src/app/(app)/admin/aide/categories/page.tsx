import { Callout, GuideNav, GuidePage, GuideSection, Path, Step, Steps } from "@/components/guide";
import { FLAT_GUIDES } from "../guides";

export default function GuideCategoriesPage() {
  return (
    <GuidePage
      title="Catégories"
      description="Étiquettes colorées pour ranger tes notifications."
    >
      <GuideSection title="À quoi ça sert ?">
        <p>
          Une catégorie est une <strong>étiquette</strong> (nom + couleur + icône optionnelle) qu'on accroche à une
          notification ou à une planification. Elle apparaît dans le fil pour aider les employés à <strong>filtrer</strong>
          et <strong>identifier</strong> rapidement le type de message.
        </p>
        <p>
          Exemples : <em>Sécurité</em> (rouge 🛡), <em>RH</em> (bleu 👥), <em>Formation</em> (vert 🎓),
          <em> Urgent</em> (orange 🚨), <em>Annonce</em> (gris 📢).
        </p>
      </GuideSection>

      <GuideSection title="Créer une catégorie">
        <Steps>
          <Step number={1} title="Va sur Catégories">
            Sidebar → <Path>Catégories</Path> → « Nouvelle catégorie ».
          </Step>
          <Step number={2} title="Slug">
            Identifiant technique court (ex: <code>rh</code>, <code>securite</code>). Lettres minuscules, chiffres, tirets.
          </Step>
          <Step number={3} title="Nom affiché">
            Le nom lisible (ex: « Ressources humaines »).
          </Step>
          <Step number={4} title="Icône optionnelle">
            Un emoji (ex: 👥). Sera affiché dans la pastille.
          </Step>
          <Step number={5} title="Couleur">
            Une couleur dans la palette. Elle teintera la pastille dans le fil.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection title="Utiliser une catégorie">
        <p>
          Sur n'importe quel formulaire de notification ou de planification, le champ <strong>Catégorie</strong> est
          dans la section <em>Classement</em>. Choisis-la dans la liste déroulante — c'est tout.
        </p>
        <p>
          Côté employé, dans le fil de Notifications, la pastille colorée apparaît à côté du titre.
        </p>
      </GuideSection>

      <GuideSection title="Modifier / supprimer">
        <p>
          Sur <Path>Catégories</Path>, clique sur une catégorie pour la modifier. Tu peux changer le nom, la couleur,
          l'icône. Le slug aussi est modifiable mais évite : il identifie la catégorie.
        </p>
        <p>
          Supprimer une catégorie ne supprime <strong>pas</strong> les notifications qui l'utilisaient. Elles perdent
          juste leur étiquette (la pastille disparaît).
        </p>
      </GuideSection>

      <GuideSection title="Catégories système">
        <Callout type="info">
          Au premier démarrage, 5 catégories sont créées automatiquement (Annonce, Urgent, RH, Formation, Sécurité).
          Pour pouvoir les modifier, va dans <Path>Catégories</Path> et clique <strong>« Tout réclamer »</strong> dans
          le bandeau doré en haut.
        </Callout>
      </GuideSection>

      <GuideNav current="/admin/aide/categories" guides={FLAT_GUIDES} />
    </GuidePage>
  );
}

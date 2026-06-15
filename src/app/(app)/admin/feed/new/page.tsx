import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { listCategories } from "@/domain/categories/repository";
import { listSessions } from "@/domain/sessions/repository";
import { listTeamsWithMemberCount } from "@/domain/teams/repository";
import { listTemplates } from "@/domain/templates/repository";
import { listProfilesWithEmail } from "@/domain/users/repository";
import { getServerDictionary } from "@/lib/i18n/server";
import { FeedItemForm } from "../feed-form";
import { TemplateLoader } from "../template-loader";

export const dynamic = "force-dynamic";

export default async function NewFeedItemPage() {
  const t = getServerDictionary();
  const [categories, sessions, teams, users, templates] = await Promise.all([
    listCategories(),
    listSessions(),
    listTeamsWithMemberCount(),
    listProfilesWithEmail(),
    listTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminFeed.newItemTitle}
        description={t.adminFeed.newItemDesc}
        action={
          <LinkButton href="/admin/feed" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <Card className="p-6 space-y-5">
        <TemplateLoader templates={templates} />
        <FeedItemForm
          mode="create"
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          sessions={sessions.map((s) => ({ id: s.id, name: s.name }))}
          teams={teams.map((tm) => ({ id: tm.id, name: tm.name, color: tm.color, memberCount: tm.member_count }))}
          totalUsers={users.length}
          users={users.map((u) => ({
            id: u.id,
            name: u.display_name,
            email: u.email,
          }))}
        />
      </Card>
      <PageTip>{t.pageTips.adminFeedNew}</PageTip>
    </div>
  );
}

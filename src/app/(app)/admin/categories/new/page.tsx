import { Card, LinkButton, PageHeader, PageTip } from "@/components/ui";
import { getServerDictionary } from "@/lib/i18n/server";
import { CategoryForm } from "../category-form";

export default function NewCategoryPage() {
  const t = getServerDictionary();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t.adminCategories.newCategory}
        action={
          <LinkButton href="/admin/categories" variant="secondary">
            {t.common.back}
          </LinkButton>
        }
      />
      <Card className="p-6">
        <CategoryForm mode="create" />
      </Card>
      <PageTip>{t.pageTips.adminCategoryNew}</PageTip>
    </div>
  );
}

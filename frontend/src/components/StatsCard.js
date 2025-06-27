import { Card, Layout, Text, BlockStack, Badge } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

export default function StatsCard({ reviews }) {
  const positiveCount = reviews?.filter(
    (r) => r.sentiment === "POSITIVE"
  ).length;
  const flaggedCount = reviews?.filter(
    (r) => r.flagged && r.flagged.length > 0
  ).length;
  const positivePercentage =
    reviews.length > 0 ? Math.round((positiveCount / reviews.length) * 100) : 0;

  const percentageStatus =
    positivePercentage >= 70
      ? "success"
      : positivePercentage >= 40
      ? "warning"
      : "critical";

  const flaggedStatus = flaggedCount > 0 ? "critical" : "success";

  return (
    <Layout>
      <Layout.Section oneThird>
        <Card sectioned>
          <BlockStack gap="200">
            <Text variant="headingXl" as="h2">
              {reviews.length}
            </Text>
            <Text color="subdued">Total Reviews</Text>
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section oneThird>
        <Card sectioned>
          <BlockStack gap="200">
            <Text variant="headingXl" as="h2" tone={percentageStatus}>
              {positivePercentage}%
            </Text>
            <Text color="subdued">Positive</Text>
            <Badge status={percentageStatus} tone={percentageStatus}>
              {positivePercentage >= 70
                ? "Excellent"
                : positivePercentage >= 40
                ? "Average"
                : "Needs Improvement"}
            </Badge>
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section oneThird>
        <Card sectioned>
          <BlockStack gap="200">
            <Text variant="headingXl" as="h2" tone={flaggedStatus}>
              {flaggedCount}
            </Text>
            <Text color="subdued" tone={flaggedStatus}>
              Needs Attention
            </Text>
            {flaggedCount > 0 && <Badge tone="critical">Urgent</Badge>}
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}

import { getAnalyticsPayload } from "@/lib/analytics-data";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const { secret } = await searchParams;
  if (!secret || secret !== process.env.ANALYTICS_SECRET) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Access denied
      </div>
    );
  }

  const data = await getAnalyticsPayload();

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono text-sm">
      <h1 className="text-xl font-bold mb-6">GTMO Analytics</h1>
      <p className="text-gray-500 mb-8">{data.generatedAt}</p>

      <section className="mb-10">
        <h2 className="text-emerald-400 font-semibold mb-3">Users by country</h2>
        <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-xs">
          {JSON.stringify(data.usersByCountry, null, 2)}
        </pre>
      </section>

      <section className="mb-10">
        <h2 className="text-emerald-400 font-semibold mb-3">Offer performance</h2>
        <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-xs">
          {JSON.stringify(data.offerPerformance, null, 2)}
        </pre>
      </section>

      <section className="mb-10">
        <h2 className="text-emerald-400 font-semibold mb-3">
          Conversion by country
        </h2>
        <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-xs">
          {JSON.stringify(data.conversionByCountry, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-emerald-400 font-semibold mb-3">
          Segment breakdown
        </h2>
        <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-xs">
          {JSON.stringify(data.segmentBreakdown, null, 2)}
        </pre>
      </section>
    </div>
  );
}

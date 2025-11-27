import { ClassificationResult } from "@/pages/Index";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ClassificationHistoryProps {
  results: ClassificationResult[];
}

const ClassificationHistory = ({ results }: ClassificationHistoryProps) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Classifications Yet</h3>
        <p className="text-muted-foreground">
          Upload and classify images to see your history here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Classification History</h2>
          <p className="text-muted-foreground">View all your past classifications</p>
        </div>
      </div>

      <div className="grid gap-4">
        {results.map((result) => (
          <Card key={result.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <img
                  src={result.image}
                  alt="Classification"
                  className="w-24 h-24 object-cover rounded-lg border border-border"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={result.prediction === "cattle" ? "default" : "secondary"}
                    className="font-semibold"
                  >
                    {result.prediction.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(result.timestamp, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Confidence: </span>
                    <span className="font-semibold text-primary">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Features Summary */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Cattle: </span>
                    {result.features.cattle.length} features
                  </div>
                  <div>
                    <span className="font-medium">Buffalo: </span>
                    {result.features.buffalo.length} features
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClassificationHistory;

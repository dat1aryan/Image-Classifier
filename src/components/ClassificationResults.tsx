import { CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClassificationResult } from "@/pages/Index";
import { Progress } from "@/components/ui/progress";

interface ClassificationResultsProps {
  result: ClassificationResult;
}

const ClassificationResults = ({ result }: ClassificationResultsProps) => {
  const downloadResult = () => {
    const data = {
      prediction: result.prediction,
      confidence: result.confidence,
      features: result.features,
      timestamp: new Date(result.timestamp).toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `classification-${result.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isHighConfidence = result.confidence >= 0.8;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Classification Results</h2>
        <Button variant="outline" size="sm" onClick={downloadResult}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Analyzed Image</h3>
          <div className="rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={result.image}
              alt="Classified"
              className="w-full h-auto object-contain max-h-96"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Prediction */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Prediction</h3>
            <div className="flex items-center gap-3">
              {isHighConfidence ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <AlertCircle className="h-6 w-6 text-warning" />
              )}
              <div className="flex-1">
                <Badge
                  variant={result.prediction === "cattle" ? "default" : "secondary"}
                  className="text-lg px-4 py-1"
                >
                  {result.prediction.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Confidence</h3>
              <span className="text-2xl font-bold text-primary">
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={result.confidence * 100} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {isHighConfidence
                ? "High confidence - reliable classification"
                : "Moderate confidence - please verify"}
            </p>
          </div>

          {/* Feature Comparison */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Visual Features Detected</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Cattle Features */}
              <div className="space-y-2 p-4 rounded-lg bg-muted border border-border">
                <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Cattle Indicators
                </h4>
                <ul className="space-y-1">
                  {result.features.cattle.map((feature, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buffalo Features */}
              <div className="space-y-2 p-4 rounded-lg bg-muted border border-border">
                <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  Buffalo Indicators
                </h4>
                <ul className="space-y-1">
                  {result.features.buffalo.map((feature, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassificationResults;

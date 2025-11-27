import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import ClassificationResults from "@/components/ClassificationResults";
import ClassificationHistory from "@/components/ClassificationHistory";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ClassificationResult {
  id: string;
  image: string;
  prediction: "cattle" | "buffalo";
  confidence: number;
  features: {
    cattle: string[];
    buffalo: string[];
  };
  timestamp: number;
}

const Index = () => {
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ClassificationResult | null>(null);

  const handleClassification = (result: ClassificationResult) => {
    setCurrentResult(result);
    setResults((prev) => [result, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <svg
                className="h-7 w-7 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cattle vs Buffalo Classifier</h1>
              <p className="text-muted-foreground">AI-powered livestock identification</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="classify" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="classify">Classify</TabsTrigger>
            <TabsTrigger value="history">History ({results.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="classify" className="space-y-6">
            <Card className="p-6 md:p-8 shadow-lg">
              <ImageUpload onClassification={handleClassification} />
            </Card>

            {currentResult && (
              <Card className="p-6 md:p-8 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ClassificationResults result={currentResult} />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <ClassificationHistory results={results} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by AI • Built for Agricultural Excellence</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

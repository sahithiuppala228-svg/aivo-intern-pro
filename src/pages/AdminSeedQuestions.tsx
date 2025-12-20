import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Database, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DOMAINS = [
  "Web Development",
  "Data Science",
  "Machine Learning",
  "Mobile Development",
  "UI/UX Design",
  "DevOps",
  "Cloud Computing",
  "Cybersecurity",
  "Blockchain",
  "Game Development"
];

const TARGET_QUESTIONS = 1000;

interface DomainStatus {
  domain: string;
  count: number;
  loading: boolean;
  progress: number;
}

const AdminSeedQuestions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [domainStatuses, setDomainStatuses] = useState<DomainStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = async () => {
    setRefreshing(true);
    try {
      // Fetch count for each domain
      const statuses: DomainStatus[] = await Promise.all(
        DOMAINS.map(async (domain) => {
          try {
            const { data } = await supabase.functions.invoke('get-random-mcq-questions', {
              body: { domain, count: 1 }
            });
            return {
              domain,
              count: data?.available || 0,
              loading: false,
              progress: 0
            };
          } catch {
            return { domain, count: 0, loading: false, progress: 0 };
          }
        })
      );
      setDomainStatuses(statuses);
    } catch (error) {
      console.error('Error fetching counts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch question counts",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleSeedDomain = async (domain: string) => {
    setDomainStatuses(prev => 
      prev.map(s => s.domain === domain ? { ...s, loading: true, progress: 0 } : s)
    );

    try {
      toast({
        title: "Seeding Started",
        description: `Generating questions for ${domain}. This may take several minutes...`,
      });

      const { data, error } = await supabase.functions.invoke('seed-mcq-questions', {
        body: { domain, targetCount: TARGET_QUESTIONS }
      });

      if (error) throw error;

      toast({
        title: "Seeding Complete",
        description: `Generated ${data?.generated || 0} questions for ${domain}. Total: ${data?.total || 0}`,
      });

      // Refresh counts after seeding
      await fetchCounts();
    } catch (error) {
      console.error('Error seeding:', error);
      toast({
        title: "Seeding Failed",
        description: `Failed to generate questions for ${domain}`,
        variant: "destructive"
      });
    } finally {
      setDomainStatuses(prev => 
        prev.map(s => s.domain === domain ? { ...s, loading: false } : s)
      );
    }
  };

  const getStatusBadge = (count: number) => {
    if (count >= TARGET_QUESTIONS) {
      return <Badge className="bg-success text-success-foreground">Complete</Badge>;
    }
    if (count >= TARGET_QUESTIONS * 0.5) {
      return <Badge className="bg-warning text-warning-foreground">{Math.round((count / TARGET_QUESTIONS) * 100)}%</Badge>;
    }
    if (count > 0) {
      return <Badge variant="secondary">{Math.round((count / TARGET_QUESTIONS) * 100)}%</Badge>;
    }
    return <Badge variant="outline">Empty</Badge>;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                Question Bank Admin
              </h1>
              <p className="text-muted-foreground">
                Seed {TARGET_QUESTIONS} questions per domain for the MCQ test
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchCounts}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Counts
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {domainStatuses.map((status) => (
            <Card key={status.domain} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{status.domain}</h3>
                    {getStatusBadge(status.count)}
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress 
                      value={Math.min((status.count / TARGET_QUESTIONS) * 100, 100)} 
                      className="flex-1 h-2"
                    />
                    <span className="text-sm text-muted-foreground min-w-[80px]">
                      {status.count} / {TARGET_QUESTIONS}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  {status.count >= TARGET_QUESTIONS ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Complete</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSeedDomain(status.domain)}
                      disabled={status.loading}
                      size="sm"
                    >
                      {status.loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          Generate {TARGET_QUESTIONS - status.count} Questions
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Note</h4>
              <p className="text-sm text-muted-foreground">
                Generating 1000 questions per domain takes time (approximately 5-10 minutes per domain).
                Questions are generated in batches of 20 using AI. The process will continue even if some batches fail.
                For custom domains not listed here, questions are generated on-the-fly during the exam.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSeedQuestions;

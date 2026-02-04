import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Calendar,
  BarChart3,
  BookOpen,
  Trophy,
  AlertTriangle
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface TestAttempt {
  id: string;
  domain: string;
  score: number;
  total_questions: number;
  passed: boolean;
  created_at: string;
}

interface DomainStats {
  domain: string;
  attempts: number;
  avgScore: number;
  passRate: number;
  bestScore: number;
  trend: "up" | "down" | "stable";
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalAttempts: 0,
    passedAttempts: 0,
    avgScore: 0,
    bestDomain: "",
    weakestDomain: "",
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your analytics.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_test_attempts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching attempts:", error);
        toast({
          title: "Error",
          description: "Failed to load analytics data.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setAttempts(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error("Analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: TestAttempt[]) => {
    if (data.length === 0) return;

    // Calculate overall stats
    const totalAttempts = data.length;
    const passedAttempts = data.filter(a => a.passed).length;
    const avgScore = data.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / totalAttempts;

    // Calculate domain-specific stats
    const domainMap = new Map<string, TestAttempt[]>();
    data.forEach(attempt => {
      const existing = domainMap.get(attempt.domain) || [];
      domainMap.set(attempt.domain, [...existing, attempt]);
    });

    const stats: DomainStats[] = [];
    domainMap.forEach((attempts, domain) => {
      const avgScorePercent = attempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / attempts.length;
      const passRate = (attempts.filter(a => a.passed).length / attempts.length) * 100;
      const bestScore = Math.max(...attempts.map(a => (a.score / a.total_questions) * 100));
      
      // Calculate trend (compare last 3 attempts to previous 3)
      let trend: "up" | "down" | "stable" = "stable";
      if (attempts.length >= 4) {
        const recent = attempts.slice(-3);
        const older = attempts.slice(-6, -3);
        if (older.length > 0) {
          const recentAvg = recent.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / recent.length;
          const olderAvg = older.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / older.length;
          trend = recentAvg > olderAvg + 5 ? "up" : recentAvg < olderAvg - 5 ? "down" : "stable";
        }
      }

      stats.push({
        domain,
        attempts: attempts.length,
        avgScore: avgScorePercent,
        passRate,
        bestScore,
        trend,
      });
    });

    // Sort by average score to find best and weakest
    const sortedByScore = [...stats].sort((a, b) => b.avgScore - a.avgScore);
    const bestDomain = sortedByScore[0]?.domain || "";
    const weakestDomain = sortedByScore[sortedByScore.length - 1]?.domain || "";

    setDomainStats(stats);
    setOverallStats({
      totalAttempts,
      passedAttempts,
      avgScore,
      bestDomain,
      weakestDomain,
    });
  };

  // Prepare chart data
  const scoreOverTimeData = attempts.slice(-20).map((attempt, index) => ({
    name: new Date(attempt.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: Math.round((attempt.score / attempt.total_questions) * 100),
    domain: attempt.domain,
  }));

  const domainDistributionData = domainStats.map(stat => ({
    name: stat.domain,
    value: stat.attempts,
  }));

  const domainPerformanceData = domainStats.map(stat => ({
    domain: stat.domain.length > 15 ? stat.domain.substring(0, 15) + "..." : stat.domain,
    avgScore: Math.round(stat.avgScore),
    passRate: Math.round(stat.passRate),
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-6 max-w-4xl">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <Card className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Test Data Yet</h2>
            <p className="text-muted-foreground mb-6">
              Complete some tests to see your performance analytics here.
            </p>
            <Button onClick={() => navigate("/assessment-intro")} variant="hero">
              Start Assessment
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold">Performance Analytics</h1>
            <p className="text-muted-foreground">Track your progress and identify areas for improvement</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            {attempts.length} Total Attempts
          </Badge>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover animate-slide-up">
            <CardHeader className="pb-2">
              <CardDescription>Pass Rate</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {Math.round((overallStats.passedAttempts / overallStats.totalAttempts) * 100)}%
                {(overallStats.passedAttempts / overallStats.totalAttempts) >= 0.7 ? (
                  <TrendingUp className="w-6 h-6 text-success icon-hover" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-destructive icon-hover" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {overallStats.passedAttempts} of {overallStats.totalAttempts} tests passed
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover animate-slide-up stagger-1">
            <CardHeader className="pb-2">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {Math.round(overallStats.avgScore)}%
                <Target className="w-6 h-6 text-primary icon-hover" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={overallStats.avgScore} className="h-2" />
            </CardContent>
          </Card>

          <Card className="card-hover animate-slide-up stagger-2">
            <CardHeader className="pb-2">
              <CardDescription>Strongest Domain</CardDescription>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="w-6 h-6 text-warning icon-hover" />
                {overallStats.bestDomain || "N/A"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Keep up the great work!
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover animate-slide-up stagger-3">
            <CardHeader className="pb-2">
              <CardDescription>Needs Improvement</CardDescription>
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-destructive icon-hover" />
                {overallStats.weakestDomain || "N/A"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Focus on practicing here
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Score Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Score Progression
              </CardTitle>
              <CardDescription>Your test scores over time (last 20 attempts)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Domain Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Domain Distribution
              </CardTitle>
              <CardDescription>Number of attempts per domain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={domainDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {domainDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domain Performance Comparison */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Domain Performance Comparison
            </CardTitle>
            <CardDescription>Average score and pass rate by domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domainPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="domain" type="category" width={120} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avgScore" name="Avg Score %" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="passRate" name="Pass Rate %" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Domain Cards */}
        <h2 className="text-2xl font-bold mb-4">Domain Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {domainStats.map((stat, idx) => (
            <Card key={stat.domain} className="hover:shadow-lg transition-shadow card-hover animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{stat.domain}</CardTitle>
                  {stat.trend === "up" && <TrendingUp className="w-5 h-5 text-success" />}
                  {stat.trend === "down" && <TrendingDown className="w-5 h-5 text-destructive" />}
                </div>
                <CardDescription>{stat.attempts} attempts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Average Score</span>
                    <span className="font-semibold">{Math.round(stat.avgScore)}%</span>
                  </div>
                  <Progress value={stat.avgScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pass Rate</span>
                    <span className="font-semibold">{Math.round(stat.passRate)}%</span>
                  </div>
                  <Progress 
                    value={stat.passRate} 
                    className={`h-2 ${stat.passRate >= 70 ? '[&>div]:bg-success' : stat.passRate >= 50 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'}`}
                  />
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Best Score</span>
                  <Badge variant={stat.bestScore >= 80 ? "default" : "secondary"}>
                    <Award className="w-3 h-3 mr-1" />
                    {Math.round(stat.bestScore)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Attempts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Attempts</CardTitle>
            <CardDescription>Your last 10 test attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Domain</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Score</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.slice(-10).reverse().map((attempt) => (
                    <tr key={attempt.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(attempt.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm">{attempt.domain}</td>
                      <td className="py-3 px-4 text-sm">
                        {attempt.score}/{attempt.total_questions} ({Math.round((attempt.score / attempt.total_questions) * 100)}%)
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={attempt.passed ? "default" : "destructive"}>
                          {attempt.passed ? "Passed" : "Failed"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={() => navigate("/assessment-intro")} variant="hero" size="lg">
            Take Another Test
          </Button>
          <Button onClick={() => navigate("/practice-mode")} variant="outline" size="lg">
            Practice Mode
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
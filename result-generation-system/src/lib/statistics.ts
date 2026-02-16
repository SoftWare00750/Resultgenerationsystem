import { Result } from '@/types';

export const statisticsUtils = {
  // Calculate class average
  calculateClassAverage: (results: Result[]): number => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, result) => sum + (result.averageScore || 0), 0);
    return total / results.length;
  },

  // Get grade distribution
  getGradeDistribution: (results: Result[]): Record<string, number> => {
    const distribution: Record<string, number> = {
      A: 0, B: 0, C: 0, D: 0, E: 0, F: 0,
    };

    results.forEach(result => {
      const grade = result.overallGrade || 'F';
      if (grade in distribution) {
        distribution[grade]++;
      }
    });

    return distribution;
  },

  // Calculate pass rate
  calculatePassRate: (results: Result[]): number => {
    if (results.length === 0) return 0;
    const passed = results.filter(r => r.overallGrade !== 'F').length;
    return (passed / results.length) * 100;
  },

  // Get top performers
  getTopPerformers: (results: Result[], count: number = 5): Result[] => {
    return [...results]
      .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
      .slice(0, count);
  },

  // Get subject statistics
  getSubjectStatistics: (results: Result[]) => {
    const subjectStats: Record<string, { total: number; count: number; average: number }> = {};

    results.forEach(result => {
      result.subjects.forEach(subject => {
        if (!subjectStats[subject.name]) {
          subjectStats[subject.name] = { total: 0, count: 0, average: 0 };
        }
        subjectStats[subject.name].total += subject.score;
        subjectStats[subject.name].count++;
      });
    });

    Object.keys(subjectStats).forEach(subject => {
      const stats = subjectStats[subject];
      stats.average = stats.total / stats.count;
    });

    return subjectStats;
  },

  // Calculate performance trends
  calculateTrends: (results: Result[]): {
    improving: number;
    declining: number;
    stable: number;
  } => {
    // This would require historical data comparison
    // Placeholder implementation
    return {
      improving: 0,
      declining: 0,
      stable: results.length,
    };
  },
};
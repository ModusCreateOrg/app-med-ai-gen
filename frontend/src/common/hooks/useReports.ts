import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllReports, fetchLatestReports, markReportAsRead } from '../api/reportService';
import { MedicalReport } from '../models/medicalReport';

// Query keys
const REPORTS_KEY = 'reports';
const LATEST_REPORTS_KEY = 'latestReports';

/**
 * Hook to fetch the latest reports.
 * @param limit - Maximum number of reports to fetch
 * @returns Query result with the latest reports
 */
export const useGetLatestReports = (limit = 3) => {
  return useQuery({
    queryKey: [LATEST_REPORTS_KEY, limit],
    queryFn: () => fetchLatestReports(limit),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data immediately stale so it always refreshes
  });
};

/**
 * Hook to fetch all reports.
 * @returns Query result with all reports
 */
export const useGetAllReports = () => {
  return useQuery({
    queryKey: [REPORTS_KEY],
    queryFn: fetchAllReports,
  });
};

/**
 * Hook to mark a report as read.
 * @returns Mutation result for marking a report as read
 */
export const useMarkReportAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => markReportAsRead(reportId),
    onSuccess: (updatedReport: MedicalReport) => {
      // Update the reports cache
      queryClient.setQueryData<MedicalReport[]>([REPORTS_KEY], (oldReports) => {
        if (!oldReports) return undefined;
        return oldReports.map((report) =>
          report.id === updatedReport.id ? updatedReport : report,
        );
      });

      // Update the latest reports cache
      queryClient.setQueryData<MedicalReport[]>([LATEST_REPORTS_KEY], (oldReports) => {
        if (!oldReports) return undefined;
        return oldReports.map((report) =>
          report.id === updatedReport.id ? updatedReport : report,
        );
      });
    },
  });
};

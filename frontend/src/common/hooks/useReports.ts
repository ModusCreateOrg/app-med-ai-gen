import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllReports,
  fetchLatestReports,
  markReportAsRead,
  toggleReportBookmark,
} from '../api/reportService';
import { MedicalReport } from '../models/medicalReport';
import { QueryKey } from 'common/utils/constants';

/**
 * Hook to fetch the latest reports.
 * @param limit - Maximum number of reports to fetch
 * @returns Query result with the latest reports
 */
export const useGetLatestReports = (limit = 3) => {
  return useQuery({
    queryKey: [QueryKey.LatestReports, limit],
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
    queryKey: [QueryKey.Reports],
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
      queryClient.setQueryData<MedicalReport[]>([QueryKey.Reports], (oldReports) => {
        if (!oldReports) return undefined;
        return oldReports.map((report) =>
          report.id === updatedReport.id ? updatedReport : report,
        );
      });

      // Update the latest reports cache
      queryClient.setQueryData<MedicalReport[]>([QueryKey.LatestReports], (oldReports) => {
        if (!oldReports) return undefined;
        return oldReports.map((report) =>
          report.id === updatedReport.id ? updatedReport : report,
        );
      });
    },
  });
};

/**
 * Hook to toggle the bookmark status of a report.
 * @returns Mutation result for toggling the bookmark status
 */
export const useToggleReportBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, isBookmarked }: { reportId: string; isBookmarked: boolean }) =>
      toggleReportBookmark(reportId, isBookmarked),
    onSuccess: (updatedReport: MedicalReport) => {
      // Update the reports cache
      queryClient.setQueryData<MedicalReport[]>([QueryKey.Reports], (oldReports) => {
        if (!oldReports) return undefined;
        return oldReports.map((report) =>
          report.id === updatedReport.id ? updatedReport : report,
        );
      });

      // Update the latest reports cache
      queryClient.setQueryData<MedicalReport[]>([QueryKey.LatestReports], (oldReports) => {
        if (!oldReports) return undefined;
        return oldReports.map((report) =>
          report.id === updatedReport.id ? updatedReport : report,
        );
      });

      // Update the bookmark status in the report detail page
      queryClient.setQueryData<MedicalReport | undefined>(
        [QueryKey.ReportDetail, reportId],
        (oldReport) => {
          if (!oldReport) return undefined;
          if (oldReport.id !== updatedReport.id) return oldReport;
          return { ...oldReport, bookmarked: updatedReport.bookmarked };
        },
      );
    },
  });
};

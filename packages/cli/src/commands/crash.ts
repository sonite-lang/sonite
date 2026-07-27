import {
  cleanCrashReports,
  listCrashReports,
  showCrashReport,
} from "../crash-report.js";

export function runCrashList(): number {
  const reports = listCrashReports();
  if (reports.length === 0) {
    console.log("No crash reports.");
    return 0;
  }
  for (const report of reports) {
    console.log(`${report.id}\t${report.kind}\t${report.timestamp}\t${report.message}`);
  }
  return 0;
}

export function runCrashShow(id: string): number {
  const report = showCrashReport(id);
  if (!report) {
    console.error(`error: crash report not found: ${id}`);
    return 1;
  }
  console.log(JSON.stringify(report, null, 2));
  return 0;
}

export function runCrashClean(olderThanDays?: number): number {
  const removed = cleanCrashReports(olderThanDays);
  console.log(`Removed ${removed} crash report(s).`);
  return 0;
}

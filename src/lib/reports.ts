"use client";

import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

interface AttendanceReportRow {
  studentName: string;
  studentId: string;
  courseName: string;
  courseCode: string;
  status: string;
  sessionDate: string;
  markedAt: string;
}

interface CourseReportRow {
  courseName: string;
  courseCode: string;
  department: string;
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number;
}

export function exportAttendancePDF(data: AttendanceReportRow[], title: string) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = data.map((row) => [
    row.studentName,
    row.studentId,
    row.courseCode,
    row.sessionDate,
    row.status,
  ]);

  (doc as any).autoTable({
    startY: 35,
    head: [["Student", "Student ID", "Course", "Date", "Status"]],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [29, 78, 216] },
  });

  doc.save(`${title.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}

export function exportAttendanceExcel(data: AttendanceReportRow[], title: string) {
  const wsData = data.map((row) => ({
    "Student Name": row.studentName,
    "Student ID": row.studentId,
    Course: row.courseCode,
    "Session Date": row.sessionDate,
    Status: row.status,
    "Marked At": row.markedAt,
  }));

  const ws = XLSX.utils.json_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_${Date.now()}.xlsx`);
}

export function exportCoursePDF(data: CourseReportRow[], title: string) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = data.map((row) => [
    row.courseName,
    row.courseCode,
    row.department,
    String(row.totalSessions),
    String(row.totalStudents),
    `${row.averageAttendance}%`,
  ]);

  (doc as any).autoTable({
    startY: 35,
    head: [["Course", "Code", "Department", "Sessions", "Students", "Avg Attendance"]],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [29, 78, 216] },
  });

  doc.save(`${title.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}

export function exportCourseExcel(data: CourseReportRow[], title: string) {
  const wsData = data.map((row) => ({
    Course: row.courseName,
    Code: row.courseCode,
    Department: row.department,
    "Total Sessions": row.totalSessions,
    "Total Students": row.totalStudents,
    "Average Attendance": `${row.averageAttendance}%`,
  }));

  const ws = XLSX.utils.json_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Courses");
  XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_${Date.now()}.xlsx`);
}

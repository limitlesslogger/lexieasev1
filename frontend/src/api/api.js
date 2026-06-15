export const apiFetch = (url, options = {}) => {
  const isFormData = options?.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  return fetch(`http://localhost:5001${url}`, {
    credentials: "include",
    headers,
    ...options,
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Request failed");
    }
    return data;
  });
};

// Download functions for reports
export const downloadStudentReport = async (studentId, reportType, timeframe = 30) => {
  const response = await fetch(`http://localhost:5001/api/therapist/students/${studentId}/report/${reportType}/download?timeframe=${timeframe}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.message || "Download failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Let the browser use the filename from Content-Disposition header
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
export async function downloadMyStudentReport(reportType, timeframe = 30) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:5001/api/reports/student/${reportType}/pdf?timeframe=${timeframe}`,
    {
      method: "GET",
      credentials: "include", 
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!res.ok) {
    let message = "Download failed";
    try {
      const err = await res.json();
      message = err.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportType}-report.pdf`;

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
}
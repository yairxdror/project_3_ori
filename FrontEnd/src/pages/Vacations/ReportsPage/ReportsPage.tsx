import "./ReportsPage.css";
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { VacationReportItem } from "../../../types/models";
import { downloadVacationsCsv, getVacationsReport } from "../../../api/vacationsApi";
import Button from "../../../Components/common/Button/Button";

const ReportsPage: React.FC = () => {
  const [data, setData] = useState<VacationReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  async function loadReport() {
    setLoading(true);
    setError(null);

    try {
      const result = await getVacationsReport();
      setData(result);
    } catch (err: any) {
      console.error("Failed to load report:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "An error occurred while loading the report";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  async function handleDownloadCsv() {
    setDownloading(true);
    setError(null);

    try {
      await downloadVacationsCsv();
    } catch (err: any) {
      console.error("Failed to download CSV:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "An error occurred while downloading the CSV file";
      setError(msg);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="reports-page">
      <h1 className="reports-title">Vacation & Followers Report</h1>

      {loading && <div>Loading report...</div>}

      {error && (
        <div className="reports-page__error">
          Error: {error}
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <div>No data to display.</div>
      )}

      {!loading && !error && data.length > 0 && (
        <>

          {/* CSV download button */}
          <section className="reports-page__actions">
            <Button
              variant="primary"
              onClick={handleDownloadCsv}
              disabled={downloading}
            >
              {downloading ? "Downloading file..." : "Download CSV Report ⬇"}
            </Button>
          </section>

          {/* Bar chart */}
          <section className="reports-page__chart">
            <h2>Vacations by Followers Count</h2>
            <div style={{ width: "100%", height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="destination" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="followersCount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Data table */}
          <section className="reports-page__table">
            <h2>Data Table</h2>
            <table>
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Followers Count</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.destination}>
                    <td>{item.destination}</td>
                    <td>{item.followersCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

        </>
      )}
    </div>
  );
};

export default ReportsPage;
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import CreateCase from "@/pages/CreateCase";
import ArrangeCase from "@/pages/ArrangeCase";
import SupplementCase from "@/pages/SupplementCase";
import ExceptionCase from "@/pages/ExceptionCase";
import ArchiveCase from "@/pages/ArchiveCase";
import Statistics from "@/pages/Statistics";
import CaseList from "@/pages/CaseList";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="create" element={<CreateCase />} />
          <Route path="create/:id" element={<CreateCase />} />
          <Route path="arrange/:id" element={<ArrangeCase />} />
          <Route path="supplement" element={<SupplementCase />} />
          <Route path="supplement/:id" element={<SupplementCase />} />
          <Route path="exception" element={<ExceptionCase />} />
          <Route path="exception/:id" element={<ExceptionCase />} />
          <Route path="archive" element={<ArchiveCase />} />
          <Route path="archive/:id" element={<ArchiveCase />} />
          <Route path="cases/:type" element={<CaseList />} />
          <Route path="statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  );
}

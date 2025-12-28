import {
  HashRouter as BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import RegisterPage from "../pages/Auth/RegisterPage";
import VacationsPage from "../pages/Vacations/VacationsPage/VacationsPage";
import LoginPage from "../pages/Auth/LoginPage";
import React from "react";
import "./Home.css";
import AddVacationPage from "../pages/Vacations/VacationForm/AddVacationPage";
import EditVacationPage from "../pages/Vacations/VacationForm/EditVacationPage";
import ReportsPage from "../pages/Vacations/ReportsPage/ReportsPage";
import Button from "../Components/common/Button/Button";

/* Redirect from home based on authentication status */
const HomeRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading user data...</div>;
  }

  if (user) {
    return <Navigate to="/vacations" replace />;
  }

  return <Navigate to="/login" replace />;
};

/* Route guard – authenticated users only */
const RequireAuth: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* Route guard – admin only */
const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading user data...</div>;
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/vacations" replace />;
  }

  return children;
};

// Admin tabs: Vacations / Add Vacation / Reports
const AdminTabs: React.FC = () => {
  const location = useLocation();

  const [indicatorX, setIndicatorX] = React.useState(0);
  const [indicatorWidth, setIndicatorWidth] = React.useState(0);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const vacationsRef = React.useRef<HTMLAnchorElement | null>(null);
  const addRef = React.useRef<HTMLAnchorElement | null>(null);
  const reportsRef = React.useRef<HTMLAnchorElement | null>(null);

  let active: "vacations" | "add" | "reports" = "vacations";

  if (location.pathname.startsWith("/admin/vacations/new")) {
    active = "add";
  } else if (location.pathname.startsWith("/admin/reports")) {
    active = "reports";
  } else if (
    location.pathname.startsWith("/vacations") ||
    location.pathname.startsWith("/admin/vacations/")
  ) {
    active = "vacations";
  }

  const updateIndicator = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    let el: HTMLAnchorElement | null = null;
    if (active === "vacations") el = vacationsRef.current;
    else if (active === "add") el = addRef.current;
    else el = reportsRef.current;

    if (!el) return;

    const x = el.offsetLeft;
    const w = el.offsetWidth;

    setIndicatorX(x);
    setIndicatorWidth(w);
  }, [active]);

  React.useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  React.useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  return (
    <div
      ref={containerRef}
      className="nav-segmented"
      data-active={active}
      style={
        {
          "--indicator-x": `${indicatorX}px`,
          "--indicator-width": `${indicatorWidth}px`,
        } as React.CSSProperties
      }
    >
      <NavLink
        to="/vacations"
        className="nav-segmented__item"
        ref={vacationsRef}
      >
        Vacations
      </NavLink>

      <NavLink
        to="/admin/vacations/new"
        className="nav-segmented__item"
        ref={addRef}
      >
        Add Vacation
      </NavLink>

      <NavLink
        to="/admin/reports"
        className="nav-segmented__item"
        ref={reportsRef}
      >
        Reports
      </NavLink>

      <div className="nav-segmented__indicator" />
    </div>
  );
};

/* header + content area */
const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isAdmin = user?.isAdmin === true;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__left">
          <h1>VACATIONLAND</h1>
        </div>

        {/* decorative planes in background */}
        <div className="home-plane">
          <span className="home-plane__icon">✈</span>
          <span className="home-plane__cloud" />
        </div>

        <nav className="app-header__nav">
          {user && (
            <>
              {isAdmin && <AdminTabs />}

              <span className="app-header__user">
                Hello {user.firstName} {user.lastName}
                {isAdmin && " (manager)"}
              </span>

              <Button variant="danger" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </nav>

      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

const Home: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages – rendered without MainLayout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Main layout for the rest of the app */}
        <Route element={<MainLayout />}>
          {/* Home – redirect based on authentication status */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Vacations page – requires authentication */}
          <Route
            path="/vacations"
            element={
              <RequireAuth>
                <VacationsPage />
              </RequireAuth>
            }
          />

          {/* Add vacation – admin only */}
          <Route
            path="/admin/vacations/new"
            element={
              <RequireAdmin>
                <AddVacationPage />
              </RequireAdmin>
            }
          />

          {/* Edit vacation – admin only */}
          <Route
            path="/admin/vacations/:id/edit"
            element={
              <RequireAdmin>
                <EditVacationPage />
              </RequireAdmin>
            }
          />

          {/* Reports – admin only */}
          <Route
            path="/admin/reports"
            element={
              <RequireAdmin>
                <ReportsPage />
              </RequireAdmin>
            }
          />
        </Route>

        {/* Unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Home;
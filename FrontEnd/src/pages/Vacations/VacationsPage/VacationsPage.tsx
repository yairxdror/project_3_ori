import "./VacationsPage.css";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import {
  getVacations,
  followVacation,
  unfollowVacation,
  deleteVacation,
} from "../../../api/vacationsApi";
import {
  type PaginatedVacationsResponse,
  type Vacation,
  type VacationsFilter,
} from "../../../types/models";
import VacationsList from "../../../Components/vacations/VacationsList/VacationsList";
import filterIcon from "../../../assets/filter.png";
import Pagination from "../../../Components/common/Pagination/Pagination";
import ConfirmDialog from "../../../Components/common/ConfirmDialog/ConfirmDialog";
import { useToast } from "../../../hooks/useToast";

const PAGE_SIZE = 6;

const VacationsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();

  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<VacationsFilter>("all");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const consumedToastNonceRef = useRef<string | null>(null);

  useEffect(() => {
    const state = location.state as any;
    const flash = state?.toast;
    const nonce = state?.toastNonce;

    if (!flash || !nonce) return;
    if (consumedToastNonceRef.current === nonce) return;
    consumedToastNonceRef.current = nonce;

    toast.push({
      variant: flash.variant,
      title: flash.title,
      message: flash.message,
      durationMs: flash.durationMs,
    });

    // Clears state so it doesn't show again.
    navigate(location.pathname, { replace: true, state: null });
  }, [location.key, location.pathname, location.state, navigate, toast]);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    vacationId: number | null;
    destination?: string;
  }>({ open: false, vacationId: null });

  const [deleteBusy, setDeleteBusy] = useState<boolean>(false);


  const totalPages =
    totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  const isAdmin = user?.isAdmin === true;
  const handleFilterChange = (newFilter: VacationsFilter) => {
    if (isAdmin && newFilter === "following") {
      newFilter = "all";
    }

    setFilter(newFilter);
    setPage(1);
  };

  async function loadVacations() {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res: PaginatedVacationsResponse = await getVacations({
        page,
        pageSize: PAGE_SIZE,
        filter,
      });

      setVacations(res.vacations);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error("Failed to load vacations:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load vacations";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadVacations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, filter]);

  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    handleFilterChange(e.target.value as VacationsFilter);
  };

  const handleFollow = async (vacationId: number) => {
    // Optimistic update of the item in the list
    setVacations((prev) =>
      prev.map((v) =>
        v.id === vacationId
          ? {
            ...v,
            isFollowedByCurrentUser: true,
            followersCount: v.followersCount + 1,
          }

          : v
      )
    );

    try {
      await followVacation(vacationId);
    } catch (err: any) {
      console.error("Follow error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to follow vacation";
      setError(msg);

      // Revert to previous state on error
      setVacations((prev) =>
        prev.map((v) =>
          v.id === vacationId
            ? {
              ...v,
              isFollowedByCurrentUser: false,
              followersCount: Math.max(0, v.followersCount - 1),
            }
            : v
        )
      );
    }
  };

  const handleUnfollow = async (vacationId: number) => {
    // Optimistic update
    setVacations((prev) =>
      prev.map((v) =>
        v.id === vacationId
          ? {
            ...v,
            isFollowedByCurrentUser: false,
            followersCount: Math.max(0, v.followersCount - 1),
          }
          : v
      )
    );

    try {
      await unfollowVacation(vacationId);
    } catch (err: any) {
      console.error("Unfollow error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to unfollow vacation";
      setError(msg);

      // Revert to previous state on error
      setVacations((prev) =>
        prev.map((v) =>
          v.id === vacationId
            ? {
              ...v,
              isFollowedByCurrentUser: true,
              followersCount: v.followersCount + 1,
            }
            : v
        )
      );
    }
  };


  const handleEdit = (vacationId: number) => {
    navigate(`/admin/vacations/${vacationId}/edit`);
  };

  const handleDelete = (vacationId: number) => {
    const dest = vacations.find((v) => v.id === vacationId)?.destination;
    setConfirmState({ open: true, vacationId, destination: dest });
  };

  const performDelete = async () => {
    if (!confirmState.vacationId) return;

    setDeleteBusy(true);
    setError(null);

    const id = confirmState.vacationId;
    const dest = confirmState.destination;

    try {
      await deleteVacation(id);

      await loadVacations();

      toast.success(
        dest ? `Vacation "${dest}" was deleted successfully.` : "Vacation was deleted successfully.",
        "Delete completed"
      );

      setConfirmState({ open: false, vacationId: null });
    } catch (err: any) {
      console.error("Delete vacation error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete vacation";

      setError(msg);

      toast.error(msg, "Delete failed");

    } finally {
      setDeleteBusy(false);
    }
  };

  const cancelDelete = () => {
    if (deleteBusy) return;
    setConfirmState({ open: false, vacationId: null });
  };



  if (authLoading) {
    return <div>Loading user data...</div>;
  }

  if (!user) {
    return (
      <div>
        <h2>You must log in to view vacations</h2>
      </div>
    );
  }

  return (
    <div className="vacations-page">

      {/*select*/}
      <section className="vacations-page__filters">
        <label className="vacations-filter-select">

          <select
            value={filter}
            onChange={handleSelectChange}
            className="vacations-filter-select__control"
          >
            <option value="all">All Vacations</option>
            {!isAdmin && (
              <option value="following">Vacations I Follow</option>
            )}
            <option value="upcoming">Upcoming Vacations</option>
            <option value="active">Active Vacations</option>
          </select>
          <img className="vacations-filter-select__icon" src={filterIcon} alt="filter" />
        </label>
      </section>

      <section className="vacations-page__list">
        <VacationsList
          vacations={vacations}
          isAdmin={isAdmin}
          isLoading={loading}
          error={error}
          onFollow={isAdmin ? undefined : handleFollow}
          onUnfollow={isAdmin ? undefined : handleUnfollow}
          onEdit={isAdmin ? handleEdit : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
        />
      </section>

      {!loading && totalCount > 0 && (
        <footer className="vacations-page__pagination">
          <Pagination
            onPageChange={setPage}
            currentPage={page}
            totalPages={totalPages}

          />
        </footer>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title="Delete vacation"
        description={
          confirmState.destination
            ? `Are you sure you want to delete "${confirmState.destination}"? This action cannot be undone.`
            : "Are you sure you want to delete this vacation? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        isBusy={deleteBusy}
        onConfirm={performDelete}
        onCancel={cancelDelete}
      />

    </div>
  );
};

export default VacationsPage;
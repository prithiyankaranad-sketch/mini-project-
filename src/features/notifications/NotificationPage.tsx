import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import {
  command,
  institutionDate,
  privateQuery,
  useRemote,
} from "../../lib/portal";
import { notificationSchema } from "../../types/portal";
import { Button } from "../../components/ui/button";
import {
  PageHeader,
  Pager,
  RemoteState,
  useAction,
} from "../../components/ui/portal";
export function NotificationsPage() {
  const [page, setPage] = useState(0);
  const query = useRemote(
    () => privateQuery("notifications", { page }, z.array(notificationSchema)),
    String(page),
  );
  const action = useAction(query.reload);
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Your actual in-app notifications. Email delivery is tracked separately by the server."
      />
      {action.status}
      <RemoteState {...query} empty={query.data?.length === 0}>
        {query.data?.map((n) => (
          <article className="card list-row" key={n.id}>
            <span className="badge">{n.read_at ? "Read" : "Unread"}</span>
            <h2>{n.title}</h2>
            <p>{n.message}</p>
            <p className="muted">{institutionDate(n.created_at)}</p>
            <div className="actions">
              {n.event_id && (
                <Link to={`/events/${n.event_id}`}>Open event</Link>
              )}
              {!n.read_at && (
                <Button
                  variant="outline"
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(() =>
                      command("notification_read", { id: n.id }),
                    )
                  }
                >
                  Mark as read
                </Button>
              )}
            </div>
          </article>
        ))}
      </RemoteState>
      <Pager
        page={page}
        setPage={setPage}
        hasNext={query.data?.length === 20}
      />
    </>
  );
}

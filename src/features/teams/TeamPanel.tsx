import { z } from "zod";
import { command, privateQuery, useRemote } from "../../lib/portal";
import { teamSchema } from "../../types/portal";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../../components/ui/button";
import { RecordForm, RemoteState, useAction } from "../../components/ui/portal";
export function TeamPanel({
  eventId,
  onSelect,
}: {
  eventId: string;
  onSelect: (id: string) => void;
}) {
  const auth = useAuth();
  const query = useRemote(
    () => privateQuery("teams", { event_id: eventId }, z.array(teamSchema)),
    eventId,
  );
  const action = useAction(query.reload);
  return (
    <section className="card section-gap">
      <h2>Team registration</h2>
      <p>
        Invite genuine verified accounts. Every invited member must accept
        before the team leader registers all members together.
      </p>
      {action.status}
      <RecordForm
        fields={[{ name: "name", label: "Team name", required: true }]}
        onSubmit={async (values) => {
          await command("team_create", {
            event_id: eventId,
            name: String(values.name),
          });
          query.reload();
        }}
        submitLabel="Create team"
      />
      <RemoteState {...query}>
        {query.data?.map((t) => (
          <article key={t.id} className="list-row">
            <h3>
              {t.name} · {t.status}
            </h3>
            <ul>
              {t.members.map((m) => (
                <li key={m.user_id}>
                  {m.name} — {m.status}
                </li>
              ))}
            </ul>
            {t.leader_id === auth.user?.id ? (
              <>
                <label className="check-label">
                  <input
                    type="radio"
                    name="registration_team"
                    value={t.id}
                    onChange={() => onSelect(t.id)}
                  />
                  Select this team for registration
                </label>
                <RecordForm
                  fields={[
                    {
                      name: "email",
                      label: "Invite member by their real college email",
                      type: "email",
                      required: true,
                    },
                  ]}
                  onSubmit={async (values) => {
                    await command("team_invite", {
                      team_id: t.id,
                      email: String(values.email),
                    });
                    query.reload();
                  }}
                  submitLabel="Send team invitation"
                />
              </>
            ) : (
              t.members.some(
                (m) => m.user_id === auth.user?.id && m.status === "invited",
              ) && (
                <div className="actions">
                  <Button
                    onClick={() =>
                      void action.run(() =>
                        command("team_accept", { team_id: t.id }),
                      )
                    }
                  >
                    Accept invitation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void action.run(() =>
                        command("team_decline", { team_id: t.id }),
                      )
                    }
                  >
                    Decline invitation
                  </Button>
                </div>
              )
            )}
          </article>
        ))}
      </RemoteState>
    </section>
  );
}

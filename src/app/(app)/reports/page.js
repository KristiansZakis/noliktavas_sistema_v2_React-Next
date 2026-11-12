import { requirePermission } from "@/lib/auth";
import { can, REPORTS } from "@/lib/constants";
import { buildReport } from "@/lib/services";

export default async function Page({ searchParams }) {
    const user = await requirePermission(["reports.warehouse", "reports.placement"]);
    const allowed = Object.entries(REPORTS).filter(([, r]) => can(user.role, r.permission));
    const { type } = await searchParams;
    const chosen = allowed.find(([key]) => key === type)?.[0];
    const report = chosen ? buildReport(chosen, user) : null;

    return (
        <>
            <h1>Reports</h1>
            <form className="form">
                <label>
                    Report
                    <select name="type" defaultValue={chosen ?? allowed[0][0]}>
                        {allowed.map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
                    </select>
                </label>
                <button className="primary" type="submit">Generate</button>
            </form>

            {report && (
                <>
                    <h2>{report.title}</h2>
                    {report.summary.map((s) => <p key={s} className="muted">{s}</p>)}
                    {report.sections.map((s) => (
                        <section key={s.title}>
                            <h2>{s.title}</h2>
                            <div className="table-wrap">
                                <table>
                                    <thead><tr>{s.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                                    <tbody>
                                        {s.rows.length === 0 && <tr><td colSpan={s.head.length} className="muted">None.</td></tr>}
                                        {s.rows.map((row, i) => (
                                            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}
                </>
            )}
        </>
    );
}

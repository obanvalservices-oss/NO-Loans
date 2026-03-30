import { formatContractDate } from "@/lib/dates";
import { getLoanDetail } from "@/lib/loan-queries";
import { ensureContractPrintAccessible } from "@/lib/policy-guards";
import { requireCompanyScope } from "@/lib/require-auth";
import { centsToDisplay } from "@/lib/money";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "./PrintButton";
import "./contract-print.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ContractPage({ params }: Props) {
  await ensureContractPrintAccessible();
  const { id: raw } = await params;
  const id = Number(raw);
  if (Number.isNaN(id)) notFound();

  const scope = await requireCompanyScope();
  const detail = await getLoanDetail(id, scope);
  if (!detail) notFound();

  const { loan, company, employee } = detail;

  const today = new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

  const principal = centsToDisplay(loan.principal_cents);
  const weekly = centsToDisplay(loan.weekly_payment_cents);
  const startWeek = formatContractDate(loan.start_date);

  const farm = loan.farm.trim() || "la ubicación de trabajo indicada";
  const owner = company.owner_name.trim() || "el representante autorizado de la empresa";
  const approved = loan.approved_by.trim() || "la persona autorizada";

  const addrLines = company.address_line
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="no-print sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link
            href={`/loans/${loan.id}`}
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-500"
          >
            ← Back to loan
          </Link>
          <PrintButton />
        </div>
      </div>

      <article
        lang="es"
        className="contract-letter px-4 py-8 text-sm leading-relaxed sm:px-6 sm:py-10 sm:text-[11pt] sm:leading-snug print:px-0 print:py-0"
      >
        <header className="contract-head text-center">
          <h1 className="text-base font-bold uppercase tracking-wide text-slate-900 sm:text-lg print:text-[12pt]">
            {company.name}
          </h1>
          {company.header_note ? (
            <p className="mt-1 text-xs text-slate-600 print:text-[10pt]">{company.header_note}</p>
          ) : null}
          {addrLines.length > 0 ? (
            <div className="mt-2 text-xs text-slate-800 sm:text-sm print:text-[11pt]">
              {addrLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
          {company.phone ? (
            <p className="mt-1 text-xs text-slate-800 sm:text-sm print:text-[11pt]">{company.phone}</p>
          ) : null}
        </header>

        <div className="contract-meta mt-6 flex flex-col gap-2 text-xs sm:text-sm print:text-[11pt]">
          <div className="flex justify-end">
            <span className="font-semibold text-slate-900">
              Préstamo N.º {loan.id}
            </span>
          </div>
          <div className="flex justify-end text-slate-800">
            <span>Fecha: {today}</span>
          </div>
        </div>

        <div className="mt-8 space-y-4 text-slate-900 print:mt-6">
          <p>
            Por medio del presente <strong>{company.name}</strong> otorga un préstamo
            de <strong>{principal}</strong> a <strong>{employee.full_name}</strong>, quien
            labora en <strong>{farm}</strong>. El pago será de{" "}
            <strong>{weekly}</strong> semanales, comenzando la semana del{" "}
            <strong>{startWeek}</strong>, mediante descuento del cheque de nómina hasta
            completar el saldo total acordado.
          </p>
          <p>
            <strong>{employee.full_name}</strong> acepta las condiciones establecidas
            por <strong>{owner}</strong> y confirma haber recibido el monto solicitado en
            la fecha de este documento.
          </p>
          <p>
            Este préstamo ha sido aprobado por <strong>{approved}</strong>, según su
            criterio, quien será responsable en caso de incumplimiento del presente
            préstamo.
          </p>
        </div>

        {loan.notes ? (
          <p className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600 print:hidden">
            <span className="font-semibold text-slate-800">Notas internas:</span>{" "}
            {loan.notes}
          </p>
        ) : null}

        <footer className="contract-sign mt-12 max-w-md print:mt-10">
          <div className="border-t border-slate-900 pt-2 text-xs text-slate-800 print:text-[11pt]">
            Firma del Empleado
          </div>
        </footer>
      </article>
    </div>
  );
}

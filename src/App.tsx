// listo para vercel
import { type FormEvent, type ReactNode, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Box,
  Calculator,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  Edit3,
  FileBarChart2,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
  ArrowUpRight,
  CalendarDays,
  Camera,
} from "lucide-react";
import {
  getGetDashboardSummaryQueryKey,
  getGetMonthlyReportQueryKey,
  getGetWeeklyReportQueryKey,
  getGetOverviewReportQueryKey,
  getListBusinessesQueryKey,
  getListProductsQueryKey,
  getListSalesQueryKey,
  useCreateBusiness,
  useCreateProduct,
  useCreateSale,
  useDeleteProduct,
  useDeleteSale,
  useGetDashboardSummary,
  useGetMonthlyReport,
  useGetOverviewReport,
  useGetWeeklyReport,
  useListBusinesses,
  useListProducts,
  useListSales,
  useUpdateProduct,
  type Business,
  type OverviewReport,
  type Product,
  type Sale,
} from "@workspace/api-client-react";
import { Route, Switch, Link, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();
const money = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "short",
});
const monthName = new Intl.DateTimeFormat("es-EC", {
  month: "long",
  year: "numeric",
});
const today = new Date();
const currentMonth = today.toISOString().slice(0, 7);

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}
function formatMoney(value = 0) {
  return money.format(value);
}
function initials(name = "") {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
function businessRoot(business: Pick<Business, "slug">) {
  return business.slug === "maquillaje"
    ? "/maquillaje"
    : business.slug === "detalles-ramos"
      ? "/detalles"
      : `/negocio/${business.slug}`;
}
function businessSlugFromLocation(location: string) {
  if (location.startsWith("/maquillaje")) return "maquillaje";
  if (location.startsWith("/detalles")) return "detalles-ramos";
  if (location.startsWith("/negocio/")) return location.split("/")[2];
  return undefined;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MainRouter />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function MainRouter() {
  const [businessId, setBusinessId] = useState<number>(
    () => Number(localStorage.getItem("control-business")) || 1,
  );
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const businesses = useListBusinesses({
    query: { queryKey: getListBusinessesQueryKey() },
  });
  const routeSlug = businessSlugFromLocation(location);
  const selected =
    businesses.data?.find((business) =>
      routeSlug ? business.slug === routeSlug : business.id === businessId,
    ) ?? businesses.data?.[0];
  const changeBusiness = (id: number) => {
    setBusinessId(id);
    localStorage.setItem("control-business", String(id));
    const nextBusiness = businesses.data?.find(
      (business) => business.id === id,
    );
    if (nextBusiness) setLocation(businessRoot(nextBusiness));
  };
  const handleBusinessCreated = (created: Business) => {
    queryClient.setQueryData<Business[]>(
      getListBusinessesQueryKey(),
      (current) => [...(current ?? []), created],
    );
    queryClient.invalidateQueries({ queryKey: getGetOverviewReportQueryKey() });
    setBusinessId(created.id);
    localStorage.setItem("control-business", String(created.id));
    setLocation(businessRoot(created));
  };

  if (businesses.isLoading) return <LoadingPage />;
  if (businesses.isError || !selected)
    return (
      <CenteredState
        title="No pudimos cargar tus negocios"
        body="Revisa tu conexión e intenta de nuevo."
        action={businesses.refetch}
      />
    );
  return (
    <AppShell
      business={selected}
      businesses={businesses.data ?? []}
      onBusinessChange={changeBusiness}
      onBusinessCreated={handleBusinessCreated}
    >
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/general">
            <OverviewPage />
          </Route>
          <Route path="/detalles/inventario">
            <InventoryPage business={selected} />
          </Route>
          <Route path="/detalles/ventas">
            <SalesPage business={selected} />
          </Route>
          <Route path="/detalles/reportes">
            <ReportsPage business={selected} />
          </Route>
          <Route path="/detalles">
            <DashboardPage business={selected} />
          </Route>
          <Route path="/maquillaje/inventario">
            <InventoryPage business={selected} />
          </Route>
          <Route path="/maquillaje/ventas">
            <SalesPage business={selected} />
          </Route>
          <Route path="/maquillaje/reportes">
            <ReportsPage business={selected} />
          </Route>
          <Route path="/maquillaje">
            <DashboardPage business={selected} />
          </Route>
          <Route path="/negocio/:slug/inventario">
            <InventoryPage business={selected} />
          </Route>
          <Route path="/negocio/:slug/ventas">
            <SalesPage business={selected} />
          </Route>
          <Route path="/negocio/:slug/reportes">
            <ReportsPage business={selected} />
          </Route>
          <Route path="/negocio/:slug">
            <DashboardPage business={selected} />
          </Route>
          <Route path="/">
            <DashboardPage business={selected} />
          </Route>
          <Route path="/inventario">
            <InventoryPage business={selected} />
          </Route>
          <Route path="/ventas">
            <SalesPage business={selected} />
          </Route>
          <Route path="/reportes">
            <ReportsPage business={selected} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </AppShell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function AppShell({
  business,
  businesses,
  onBusinessChange,
  onBusinessCreated,
  children,
}: {
  business: Business;
  businesses: Business[];
  onBusinessChange: (id: number) => void;
  onBusinessCreated: (business: Business) => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessModal, setBusinessModal] = useState(false);
  const [location] = useLocation();
  return (
    <div className="shell-texture min-h-[100dvh] bg-background text-foreground lg:flex">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b bg-card/95 px-5 backdrop-blur lg:hidden">
        <Brand compact />
        <button
          data-testid="button-open-menu"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2 hover:bg-muted"
        >
          <Menu size={22} />
        </button>
      </header>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[268px] -translate-x-full bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-transform lg:sticky lg:top-0 lg:h-[100dvh] lg:translate-x-0",
          mobileOpen && "translate-x-0",
        )}
      >
        <div className="flex h-full flex-col px-5 py-6">
          <div className="flex items-center justify-between">
            <Brand light />
            <button
              data-testid="button-close-menu"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
            >
              <X size={19} />
            </button>
          </div>
          <div className="mt-9 rounded-2xl border border-white/10 bg-white/[.07] p-3">
            <p className="px-1 text-[10px] font-bold uppercase tracking-[.18em] text-white/45">
              Negocio activo
            </p>
            <select
              data-testid="select-business"
              value={business.id}
              onChange={(event) => onBusinessChange(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer appearance-none bg-transparent pr-2 text-[15px] font-semibold outline-none"
            >
              {businesses.map((item) => (
                <option className="bg-[#1e4c43]" key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="mt-1 truncate px-1 text-xs text-white/55">
              {business.description}
            </p>
          </div>
          <nav className="mt-8 space-y-1">
            <NavItem
              href="/general"
              active={location === "/general"}
              icon={BarChart3}
              label="Comparativo general"
              onClick={() => setMobileOpen(false)}
            />
            <p className="mb-3 mt-7 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/40">
              Tus negocios
            </p>
            {businesses.map((item) => {
              const itemRoot = businessRoot(item);
              const activeBusiness = item.id === business.id;
              return (
                <div key={item.id} className="mb-3">
                  <Link
                    href={itemRoot}
                    onClick={() => {
                      onBusinessChange(item.id);
                      setMobileOpen(false);
                    }}
                    data-testid={`link-business-${item.slug}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                      activeBusiness
                        ? "bg-white/10 text-white"
                        : "text-white/55 hover:bg-white/[.06] hover:text-white",
                    )}
                  >
                    {item.slug === "maquillaje" ? (
                      <Sparkles size={18} />
                    ) : (
                      <ShoppingBag size={18} />
                    )}
                    <span className="truncate">{item.name}</span>
                    {activeBusiness && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />
                    )}
                  </Link>
                  {activeBusiness && (
                    <div className="ml-2 mt-1 border-l border-white/10 pl-2">
                      <NavItem
                        href={itemRoot}
                        active={location === itemRoot}
                        icon={LayoutDashboard}
                        label="Resumen"
                        onClick={() => setMobileOpen(false)}
                      />
                      <NavItem
                        href={`${itemRoot}/inventario`}
                        active={location === `${itemRoot}/inventario`}
                        icon={Box}
                        label="Inventario"
                        onClick={() => setMobileOpen(false)}
                      />
                      <NavItem
                        href={`${itemRoot}/ventas`}
                        active={location === `${itemRoot}/ventas`}
                        icon={ReceiptText}
                        label="Ventas"
                        onClick={() => setMobileOpen(false)}
                      />
                      <NavItem
                        href={`${itemRoot}/reportes`}
                        active={location === `${itemRoot}/reportes`}
                        icon={BarChart3}
                        label="Reportes"
                        onClick={() => setMobileOpen(false)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              data-testid="button-add-business"
              onClick={() => setBusinessModal(true)}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/[.06] hover:text-white"
            >
              <Plus size={18} />
              <span>Agregar negocio</span>
            </button>
          </nav>
          <div className="mt-auto border-t border-white/10 pt-5">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--sidebar-primary))] text-sm font-bold text-[#193a34]">
                V
              </div>
              <div>
                <p className="text-sm font-semibold">Valeria</p>
                <p className="text-xs text-white/45">Cuenta personal</p>
              </div>
            </div>
            <p className="mt-6 px-2 text-[11px] leading-relaxed text-white/40">
              Tus números, en su lugar. Sin mezclar historias.
            </p>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          aria-label="Cerrar menú"
          data-testid="button-menu-overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-[#193a34]/30 lg:hidden"
        />
      )}
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          {children}
        </div>
      </main>
      {businessModal && (
        <BusinessModal
          onClose={() => setBusinessModal(false)}
          onCreated={(created) => {
            setBusinessModal(false);
            onBusinessCreated(created);
          }}
        />
      )}
    </div>
  );
}

function Brand({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-[13px] text-lg font-bold",
          light
            ? "bg-[hsl(var(--sidebar-primary))] text-[#193a34]"
            : "bg-primary text-primary-foreground",
        )}
      >
        C
      </div>
      <div className={cn("leading-none", compact && "hidden sm:block")}>
        <p
          className={cn(
            "font-serif text-lg font-bold tracking-tight",
            light ? "text-white" : "text-foreground",
          )}
        >
          control
        </p>
        <p
          className={cn(
            "mt-1 text-[9px] font-bold uppercase tracking-[.2em]",
            light ? "text-white/45" : "text-muted-foreground",
          )}
        >
          emprendimientos
        </p>
      </div>
    </Link>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: typeof Box;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      data-testid={`link-nav-${label.toLowerCase()}`}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-white/10 text-white shadow-sm"
          : "text-white/60 hover:bg-white/[.06] hover:text-white",
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      <span>{label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />
      )}
    </Link>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="animate-rise">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-primary">
          {eyebrow}
        </p>
        <h1 className="font-serif text-[34px] leading-[1.05] tracking-[-.035em] text-foreground sm:text-[42px]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function BusinessModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (business: Business) => void;
}) {
  const create = useCreateBusiness();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim() || !description.trim()) {
      setError("Completa el nombre y cuéntanos de qué trata este negocio.");
      return;
    }
    create.mutate(
      { data: { name: name.trim(), description: description.trim() } },
      {
        onSuccess: onCreated,
        onError: () =>
          setError("No pudimos agregar el negocio. Intenta nuevamente."),
      },
    );
  };
  return (
    <Modal title="Agregar negocio" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-secondary/45 p-4">
          <p className="text-sm font-bold">Un nuevo espacio para tus números</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Al agregarlo tendrá automáticamente resumen, inventario, ventas y
            reportes propios.
          </p>
        </div>
        <Field
          label="Nombre del negocio"
          value={name}
          onChange={setName}
          placeholder="Ej. Repostería"
          testId="input-business-name"
        />
        <label className="block text-sm font-semibold">
          ¿De qué trata?
          <textarea
            data-testid="input-business-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej. Postres caseros para celebraciones..."
            className="mt-2 min-h-24 w-full resize-y rounded-xl border bg-card p-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        {error && (
          <p
            data-testid="text-business-error"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            testId="button-cancel-business"
            variant="quiet"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            testId="button-save-business"
            type="submit"
            disabled={create.isPending}
          >
            {create.isPending ? "Agregando..." : "Agregar negocio"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function OverviewPage() {
  const overview = useGetOverviewReport({
    query: { queryKey: getGetOverviewReportQueryKey() },
  });
  const data = overview.data;
  const comparison = data?.businesses ?? [];
  const bestProfit = comparison.length
    ? comparison.reduce((best, item) =>
        item.profit > best.profit ? item : best,
      )
    : undefined;
  const highestExpenses = comparison.length
    ? comparison.reduce((highest, item) =>
        item.expenses > highest.expenses ? item : highest,
      )
    : undefined;
  return (
    <>
      <PageHeader
        eyebrow="Comparativo general"
        title="Todos tus negocios"
        description="Compara de un vistazo qué negocio te deja más ganancia y dónde estás teniendo más gastos."
      />
      <QueryState
        loading={overview.isLoading}
        error={overview.isError}
        retry={overview.refetch}
      >
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <ReportMetric
                label="Ventas acumuladas"
                value={formatMoney(data.totalSales)}
              />
              <ReportMetric
                label="Gastos acumulados"
                value={formatMoney(data.totalExpenses)}
              />
              <ReportMetric
                label="Ganancia total"
                value={formatMoney(data.totalProfit)}
                highlight
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-primary/20 bg-secondary/35 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary">
                      Más ganancia
                    </p>
                    <h2 className="mt-2 font-serif text-2xl">
                      {bestProfit && bestProfit.profit > 0
                        ? bestProfit.businessName
                        : "Aún no hay ganancias"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {bestProfit && bestProfit.profit > 0
                        ? `${formatMoney(bestProfit.profit)} de utilidad acumulada`
                        : "Registra ventas para empezar a comparar."}
                    </p>
                  </div>
                  <div className="rounded-xl bg-card p-3 text-primary">
                    <TrendingUp size={21} />
                  </div>
                </div>
              </Card>
              <Card className="border-[hsl(var(--accent)/.25)] bg-[hsl(var(--accent)/.06)] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[hsl(var(--accent))]">
                      Más gastos
                    </p>
                    <h2 className="mt-2 font-serif text-2xl">
                      {highestExpenses && highestExpenses.expenses > 0
                        ? highestExpenses.businessName
                        : "Aún no hay gastos"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {highestExpenses && highestExpenses.expenses > 0
                        ? `${formatMoney(highestExpenses.expenses)} en gastos acumulados`
                        : "Los gastos aparecerán al registrar ventas."}
                    </p>
                  </div>
                  <div className="rounded-xl bg-card p-3 text-[hsl(var(--accent))]">
                    <CircleDollarSign size={21} />
                  </div>
                </div>
              </Card>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                      Ganancias por negocio
                    </p>
                    <h2 className="mt-1 font-serif text-2xl">
                      Quién te deja más
                    </h2>
                  </div>
                  <TrendingUp size={19} className="text-primary" />
                </div>
                <div className="mt-8">
                  <BusinessBars items={comparison} metric="profit" />
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                      Gastos por negocio
                    </p>
                    <h2 className="mt-1 font-serif text-2xl">
                      Dónde se va el dinero
                    </h2>
                  </div>
                  <CircleDollarSign
                    size={19}
                    className="text-[hsl(var(--accent))]"
                  />
                </div>
                <div className="mt-8">
                  <BusinessBars items={comparison} metric="expenses" />
                </div>
              </Card>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}

function BusinessBars({
  items,
  metric,
}: {
  items: OverviewReport["businesses"];
  metric: "profit" | "expenses";
}) {
  const max = Math.max(...items.map((item) => Math.max(item[metric], 0)), 1);
  if (!items.length)
    return (
      <p className="rounded-xl bg-muted p-5 text-sm text-muted-foreground">
        Agrega un negocio para comenzar a comparar.
      </p>
    );
  return (
    <div className="space-y-5">
      {items.map((item) => (
        <div key={item.businessId}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.businessName}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {formatMoney(item[metric])}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                metric === "profit" ? "bg-primary" : "bg-[hsl(var(--accent))]",
              )}
              style={{ width: `${(Math.max(0, item[metric]) / max) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {item.saleCount}{" "}
            {item.saleCount === 1 ? "venta registrada" : "ventas registradas"}
          </p>
        </div>
      ))}
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  testId,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "quiet" | "danger" | "outline";
  type?: "button" | "submit";
  disabled?: boolean;
  testId: string;
}) {
  return (
    <button
      data-testid={testId}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-primary text-primary-foreground shadow-[0_5px_16px_-8px_hsl(var(--primary))] hover:brightness-110",
        variant === "quiet" && "bg-muted text-foreground hover:bg-secondary",
        variant === "outline" &&
          "border bg-card text-foreground hover:bg-muted",
        variant === "danger" &&
          "bg-destructive text-destructive-foreground hover:brightness-110",
      )}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card shadow-[0_10px_30px_-25px_hsl(218_28%_19%/.45)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}
function LoadingPage() {
  return (
    <div className="min-h-[100dvh] bg-background p-8">
      <Skeleton className="mx-auto h-10 max-w-6xl" />
      <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
function CenteredState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
          <CircleAlert size={26} />
        </div>
        <h2 className="mt-5 font-serif text-2xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        {action && (
          <Button testId="button-retry" onClick={action} variant="quiet">
            <RefreshCw size={15} /> Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}
function QueryState({
  loading,
  error,
  retry,
  children,
}: {
  loading: boolean;
  error: boolean;
  retry: () => void;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    );
  if (error)
    return (
      <CenteredState
        title="Algo no salió como esperábamos"
        body="La información no llegó. Tus datos siguen a salvo."
        action={retry}
      />
    );
  return <>{children}</>;
}

function DashboardPage({ business }: { business: Business }) {
  const dashboard = useGetDashboardSummary(
    { businessId: business.id },
    {
      query: {
        enabled: !!business.id,
        queryKey: getGetDashboardSummaryQueryKey({ businessId: business.id }),
      },
    },
  );
  const data = dashboard.data;
  const [, setLocation] = useLocation();
  const greeting =
    today.getHours() < 12
      ? "Buenos días"
      : today.getHours() < 19
        ? "Buenas tardes"
        : "Buenas noches";
  return (
    <>
      <PageHeader
        eyebrow={business.name}
        title={`${greeting}, Valeria`}
        description="Una vista clara para tomar la siguiente buena decisión."
        action={
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-primary" /> Datos
            actualizados hoy
          </div>
        }
      />
      <QueryState
        loading={dashboard.isLoading}
        error={dashboard.isError}
        retry={dashboard.refetch}
      >
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Ventas del mes"
                value={formatMoney(data.monthlySales)}
                detail={`${data.monthlyProfit >= 0 ? "+" : ""}${formatMoney(data.monthlyProfit)} de utilidad`}
                icon={CircleDollarSign}
                accent="coral"
                delay="delay-1"
              />
              <MetricCard
                label="Inventario invertido"
                value={formatMoney(data.totalInvestment)}
                detail={`${data.productCount} productos activos`}
                icon={Box}
                accent="teal"
                delay="delay-2"
              />
              <MetricCard
                label="Utilidad proyectada"
                value={formatMoney(data.projectedProfit)}
                detail={`${data.projectedRevenue ? Math.round((data.projectedProfit / data.projectedRevenue) * 100) : 0}% de margen estimado`}
                icon={TrendingUp}
                accent="gold"
                delay="delay-3"
              />
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
              <Card className="overflow-hidden">
                <div className="flex items-start justify-between border-b p-5 sm:p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                      Ritmo reciente
                    </p>
                    <h2 className="mt-1 font-serif text-2xl">
                      Ventas y utilidad
                    </h2>
                  </div>
                  <span className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                    Últimos 6 meses
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <TrendChart points={data.monthlyTrend} />
                  <div className="mt-5 flex gap-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <i className="h-2 w-2 rounded-full bg-primary" />
                      Ventas
                    </span>
                    <span className="flex items-center gap-2">
                      <i className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
                      Utilidad
                    </span>
                  </div>
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                      Esta semana
                    </p>
                    <h2 className="mt-1 font-serif text-2xl">
                      {formatMoney(data.weeklySales)}
                    </h2>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <CalendarDays size={18} />
                  </div>
                </div>
                <div className="mt-7 flex items-end justify-between">
                  <div>
                    <p className="font-mono text-3xl font-bold">
                      {data.weeklySaleCount}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ventas registradas
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-mono text-sm font-bold",
                        data.hasWeeklySales
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {data.hasWeeklySales ? "En movimiento" : "Sin ventas aún"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      de lunes a hoy
                    </p>
                  </div>
                </div>
                <div className="mt-7 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: data.hasWeeklySales ? "68%" : "8%" }}
                  />
                </div>
                <Button
                  testId="button-weekly-sales"
                  variant="quiet"
                  onClick={() => setLocation("/ventas")}
                >
                  <Plus size={15} /> Registrar venta
                </Button>
              </Card>
            </div>
            <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
              <Card>
                <div className="flex items-center justify-between border-b p-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                      Para revisar
                    </p>
                    <h2 className="mt-1 font-serif text-2xl">
                      Pequeñas alertas
                    </h2>
                  </div>
                  <Bell size={18} className="text-muted-foreground" />
                </div>
                <div className="divide-y">
                  {data.lowStockCount > 0 && (
                    <AlertRow
                      icon={PackagePlus}
                      title={`${data.lowStockCount} producto${data.lowStockCount > 1 ? "s" : ""} por surtir`}
                      body="Revisa existencias mínimas"
                      action={() => setLocation("/inventario")}
                      tone="coral"
                    />
                  )}
                  {data.noRotationCount > 0 && (
                    <AlertRow
                      icon={RefreshCw}
                      title={`${data.noRotationCount} sin rotación`}
                      body="Llevan tiempo esperando"
                      action={() => setLocation("/inventario")}
                      tone="gold"
                    />
                  )}
                  {data.lowStockCount === 0 && data.noRotationCount === 0 && (
                    <div className="p-6 text-sm text-muted-foreground">
                      Todo está en orden. Buen trabajo cuidando el inventario.
                    </div>
                  )}
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                      Lo que más se mueve
                    </p>
                    <h2 className="mt-1 font-serif text-2xl">
                      Productos destacados
                    </h2>
                  </div>
                  <Sparkles size={19} className="text-[hsl(var(--accent))]" />
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Spotlight
                    label="Más vendido"
                    name={data.topProduct ?? "Aún no hay ventas"}
                    icon={TrendingUp}
                  />
                  <Spotlight
                    label="Más lento"
                    name={data.slowestProduct ?? "Aún no hay datos"}
                    icon={RefreshCw}
                    muted
                  />
                </div>
              </Card>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
  delay,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Box;
  accent: "coral" | "teal" | "gold";
  delay: string;
}) {
  return (
    <Card className={cn("animate-rise p-5 sm:p-6", delay)}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            accent === "coral"
              ? "bg-[hsl(var(--accent)/.18)] text-[hsl(var(--accent))]"
              : accent === "gold"
                ? "bg-[#eadb9c]/35 text-[#a98728]"
                : "bg-secondary text-primary",
          )}
        >
          <Icon size={17} />
        </div>
      </div>
      <p className="mt-5 font-mono text-[28px] font-bold tracking-[-.06em]">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </Card>
  );
}
function TrendChart({
  points,
}: {
  points: Array<{
    label: string;
    sales: number;
    expenses: number;
    profit: number;
  }>;
}) {
  const max = Math.max(
    ...points.map((point) => Math.max(point.sales, point.profit)),
    1,
  );
  return (
    <div className="flex h-44 items-end gap-2 sm:gap-5">
      {points.map((point, index) => (
        <div
          className="group flex min-w-0 flex-1 flex-col items-center gap-2"
          key={`${point.label}-${index}`}
        >
          <div className="relative flex h-36 w-full max-w-12 items-end justify-center gap-1">
            <div
              title={`Ventas ${formatMoney(point.sales)}`}
              className="w-[42%] rounded-t-md bg-primary/80 transition-all group-hover:bg-primary"
              style={{ height: `${Math.max(5, (point.sales / max) * 100)}%` }}
            />
            <div
              title={`Utilidad ${formatMoney(point.profit)}`}
              className="w-[42%] rounded-t-md bg-[hsl(var(--accent)/.8)] transition-all group-hover:bg-[hsl(var(--accent))]"
              style={{ height: `${Math.max(5, (point.profit / max) * 100)}%` }}
            />
          </div>
          <span className="truncate text-[10px] text-muted-foreground">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}
function AlertRow({
  icon: Icon,
  title,
  body,
  action,
  tone,
}: {
  icon: typeof Bell;
  title: string;
  body: string;
  action: () => void;
  tone: "coral" | "gold";
}) {
  return (
    <button
      data-testid={`button-alert-${title}`}
      onClick={action}
      className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted"
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          tone === "coral"
            ? "bg-[hsl(var(--accent)/.18)] text-[hsl(var(--accent))]"
            : "bg-[#eadb9c]/35 text-[#a98728]",
        )}
      >
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
      <ArrowUpRight size={16} className="text-muted-foreground" />
    </button>
  );
}
function Spotlight({
  label,
  name,
  icon: Icon,
  muted = false,
}: {
  label: string;
  name: string;
  icon: typeof TrendingUp;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        muted ? "bg-muted/50" : "bg-secondary/45",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Icon size={14} className={muted ? "" : "text-primary"} />
        {label}
      </div>
      <p className="mt-4 truncate font-semibold">{name}</p>
    </div>
  );
}

function InventoryPage({ business }: { business: Business }) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | Product | null>(null);
  const products = useListProducts(
    { businessId: business.id, search: search || undefined },
    {
      query: {
        enabled: !!business.id,
        queryKey: getListProductsQueryKey({
          businessId: business.id,
          search: search || undefined,
        }),
      },
    },
  );
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    queryClient.invalidateQueries({
      queryKey: getGetDashboardSummaryQueryKey({ businessId: business.id }),
    });
  };
  const handleDelete = (product: Product) => {
    if (window.confirm(`¿Eliminar ${product.name}?`))
      deleteProduct.mutate({ id: product.id }, { onSuccess: refresh });
  };
  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Lo que sostiene tu negocio"
        description={`Administra compras, precios y rotación de ${business.name}.`}
        action={
          <Button testId="button-add-product" onClick={() => setModal("add")}>
            <Plus size={17} /> Agregar producto
          </Button>
        }
      />
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            data-testid="input-search-products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="h-11 w-full rounded-xl border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {products.data?.length ?? 0} productos en este negocio
        </div>
      </div>
      <QueryState
        loading={products.isLoading}
        error={products.isError}
        retry={products.refetch}
      >
        {(products.data ?? []).length === 0 ? (
          <EmptyState
            icon={Box}
            title={
              search
                ? "No encontramos coincidencias"
                : "Tu inventario empieza aquí"
            }
            body={
              search
                ? "Prueba con otra palabra."
                : "Agrega tu primer producto y tendrás sus números claros desde el principio."
            }
            action={!search ? () => setModal("add") : undefined}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-muted/60 text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">Producto</th>
                    <th className="px-4 py-4">Existencia</th>
                    <th className="px-4 py-4">Economía</th>
                    <th className="px-4 py-4">Rotación</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.data?.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onEdit={() => setModal(product)}
                      onDelete={() => handleDelete(product)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y md:hidden">
              {products.data?.map((product) => (
                <ProductMobile
                  key={product.id}
                  product={product}
                  onEdit={() => setModal(product)}
                  onDelete={() => handleDelete(product)}
                />
              ))}
            </div>
          </Card>
        )}
      </QueryState>
      {modal && (
        <ProductModal
          business={business}
          product={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr
      data-testid={`row-product-${product.id}`}
      className="group hover:bg-muted/40"
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-primary">
            {initials(product.name)}
          </div>
          <div>
            <p className="text-sm font-semibold">{product.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {product.category}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p
          className={cn(
            "font-mono text-sm font-bold",
            product.quantity <= product.minimumStock
              ? "text-[hsl(var(--accent))]"
              : "",
          )}
        >
          {product.quantity}{" "}
          <span className="font-sans text-xs font-normal text-muted-foreground">
            uds.
          </span>
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          mín. {product.minimumStock}
        </p>
      </td>
      <td className="px-4 py-4">
        <p className="font-mono text-sm">{formatMoney(product.salePrice)}</p>
        <p className="mt-0.5 text-xs text-primary">
          +{product.marginPercent}% margen
        </p>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={product.rotationStatus} />
      </td>
      <td className="px-4 py-4">
        <Actions onEdit={onEdit} onDelete={onDelete} id={product.id} />
      </td>
    </tr>
  );
}
function ProductMobile({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div data-testid={`card-product-${product.id}`} className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-primary">
            {initials(product.name)}
          </div>
          <div>
            <p className="text-sm font-semibold">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.category}</p>
          </div>
        </div>
        <Actions onEdit={onEdit} onDelete={onDelete} id={product.id} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Stock</p>
          <p className="mt-1 font-mono text-sm font-bold">{product.quantity}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Precio</p>
          <p className="mt-1 font-mono text-sm">
            {formatMoney(product.salePrice)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">Margen</p>
          <p className="mt-1 text-sm font-bold text-primary">
            {product.marginPercent}%
          </p>
        </div>
      </div>
      <div className="mt-4">
        <StatusBadge status={product.rotationStatus} />
      </div>
    </div>
  );
}
function Actions({
  onEdit,
  onDelete,
  id,
}: {
  onEdit: () => void;
  onDelete: () => void;
  id: number;
}) {
  return (
    <div className="flex justify-end gap-1">
      <button
        data-testid={`button-edit-product-${id}`}
        onClick={onEdit}
        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
      >
        <Edit3 size={16} />
      </button>
      <button
        data-testid={`button-delete-product-${id}`}
        onClick={onDelete}
        className="rounded-lg p-2 text-muted-foreground hover:bg-[hsl(var(--accent)/.15)] hover:text-destructive"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  const config = {
    healthy: ["Saludable", "bg-secondary text-primary"],
    low_stock: [
      "Stock bajo",
      "bg-[hsl(var(--accent)/.16)] text-[hsl(var(--accent))]",
    ],
    no_rotation: ["Sin rotación", "bg-[#eadb9c]/35 text-[#93761f]"],
  }[status as "healthy" | "low_stock" | "no_rotation"] ?? [
    "Revisar",
    "bg-muted text-muted-foreground",
  ];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
        config[1],
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {config[0]}
    </span>
  );
}

function ProductModal({
  business,
  product,
  onClose,
  onSaved,
}: {
  business: Business;
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: product?.name ?? "",
    category: product?.category ?? "",
    purchaseCost: String(product?.purchaseCost ?? ""),
    salePrice: String(product?.salePrice ?? ""),
    quantity: String(product?.quantity ?? ""),
    minimumStock: String(product?.minimumStock ?? ""),
    expiryDate: product?.expiryDate?.slice(0, 10) ?? "",
  });
  const set = (key: keyof typeof form, value: string) =>
    setForm((old) => ({ ...old, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const data = {
      name: form.name,
      category: form.category,
      purchaseCost: Number(form.purchaseCost),
      salePrice: Number(form.salePrice),
      quantity: Number(form.quantity),
      minimumStock: Number(form.minimumStock),
      expiryDate: form.expiryDate || null,
    };
    if (!form.name || !form.category) {
      setError("Completa el nombre y la categoría.");
      return;
    }
    const opts = {
      onSuccess: onSaved,
      onError: () =>
        setError("No pudimos guardar el producto. Intenta nuevamente."),
    };
    product
      ? update.mutate({ id: product.id, data }, opts)
      : create.mutate({ data: { businessId: business.id, ...data } }, opts);
  };
  return (
    <Modal
      title={product ? "Editar producto" : "Nuevo producto"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nombre"
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder="Ej. Vela aromática"
            testId="input-product-name"
          />
          <Field
            label="Categoría"
            value={form.category}
            onChange={(v) => set("category", v)}
            placeholder="Ej. Decoración"
            testId="input-product-category"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Costo de compra"
            type="number"
            value={form.purchaseCost}
            onChange={(v) => set("purchaseCost", v)}
            placeholder="0"
            testId="input-product-cost"
          />
          <Field
            label="Precio de venta"
            type="number"
            value={form.salePrice}
            onChange={(v) => set("salePrice", v)}
            placeholder="0"
            testId="input-product-price"
          />
          <Field
            label="Cantidad actual"
            type="number"
            value={form.quantity}
            onChange={(v) => set("quantity", v)}
            placeholder="0"
            testId="input-product-quantity"
          />
          <Field
            label="Stock mínimo"
            type="number"
            value={form.minimumStock}
            onChange={(v) => set("minimumStock", v)}
            placeholder="0"
            testId="input-product-minimum"
          />
        </div>
        <Field
          label="Caducidad (opcional)"
          type="date"
          value={form.expiryDate}
          onChange={(v) => set("expiryDate", v)}
          testId="input-product-expiry"
        />
        {error && (
          <p
            data-testid="text-product-error"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            testId="button-cancel-product"
            variant="quiet"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            testId="button-save-product"
            type="submit"
            disabled={create.isPending || update.isPending}
          >
            {create.isPending || update.isPending
              ? "Guardando..."
              : "Guardar producto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SalesPage({ business }: { business: Business }) {
  const [modal, setModal] = useState(false);
  const sales = useListSales(
    { businessId: business.id },
    {
      query: {
        enabled: !!business.id,
        queryKey: getListSalesQueryKey({ businessId: business.id }),
      },
    },
  );
  const deleteSale = useDeleteSale();
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getListSalesQueryKey() });
    queryClient.invalidateQueries({
      queryKey: getListProductsQueryKey({ businessId: business.id }),
    });
    queryClient.invalidateQueries({
      queryKey: getGetDashboardSummaryQueryKey({ businessId: business.id }),
    });
  };
  const handleDelete = (sale: Sale) => {
    if (window.confirm(`¿Eliminar la venta de ${sale.productName}?`))
      deleteSale.mutate({ id: sale.id }, { onSuccess: refresh });
  };
  return (
    <>
      <PageHeader
        eyebrow="Ventas"
        title="Cada venta cuenta"
        description="Registra una elaboración con sus materiales y conoce el precio mínimo recomendado."
        action={
          <Button testId="button-add-sale" onClick={() => setModal(true)}>
            <Plus size={17} /> Registrar venta
          </Button>
        }
      />
      <QueryState
        loading={sales.isLoading}
        error={sales.isError}
        retry={sales.refetch}
      >
        {(sales.data ?? []).length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Todavía no hay ventas"
            body="Anota tu primera venta para empezar a ver el pulso real del negocio."
            action={() => setModal(true)}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                  Historial
                </p>
                <h2 className="mt-1 font-serif text-2xl">
                  Movimientos recientes
                </h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {sales.data?.length} registros
              </span>
            </div>
            <div className="divide-y">
              {sales.data?.map((sale) => (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  onDelete={() => handleDelete(sale)}
                />
              ))}
            </div>
          </Card>
        )}
      </QueryState>
      {modal && (
        <SaleModal
          business={business}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
function SaleRow({ sale, onDelete }: { sale: Sale; onDelete: () => void }) {
  return (
    <div
      data-testid={`row-sale-${sale.id}`}
      className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--accent)/.15)] text-[hsl(var(--accent))]">
          <ShoppingBag size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{sale.productName}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {sale.description || "Sin descripción"} ·{" "}
            {date.format(new Date(sale.saleDate))}
          </p>
          {(sale.materialCost > 0 || sale.laborHours > 0) && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Materiales {formatMoney(sale.materialCost)} · Operativos{" "}
              {formatMoney(sale.operatingCost)} · Mano de obra {sale.laborHours}{" "}
              h
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6 sm:w-[340px]">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">
            Costo total
          </p>
          <p className="mt-1 font-mono text-sm">
            {formatMoney(sale.expenseAmount)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">
            Precio venta
          </p>
          <p className="mt-1 font-mono text-sm">
            {formatMoney(sale.totalAmount)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">
            Utilidad
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-primary">
            {formatMoney(sale.profitAmount)}
          </p>
        </div>
      </div>
      <button
        data-testid={`button-delete-sale-${sale.id}`}
        onClick={onDelete}
        className="self-end rounded-lg p-2 text-muted-foreground hover:bg-[hsl(var(--accent)/.15)] hover:text-destructive sm:self-auto"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function MaterialAutocomplete({
  index,
  value,
  productId,
  products,
  excludedProductIds,
  onSearchChange,
  onSelect,
}: {
  index: number;
  value: string;
  productId: string;
  products: Product[];
  excludedProductIds: string[];
  onSearchChange: (value: string) => void;
  onSelect: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const search = value.trim().toLowerCase();
  const matches = products
    .filter(
      (product) =>
        !excludedProductIds.includes(String(product.id)) &&
        (!search ||
          product.name.toLowerCase().includes(search) ||
          product.category.toLowerCase().includes(search)),
    )
    .slice(0, 8);
  const selectedProduct = products.find(
    (product) => String(product.id) === productId,
  );
  return (
    <div className="relative min-w-0 flex-1">
      <input
        data-testid={`input-sale-material-${index}`}
        value={value}
        onChange={(event) => {
          onSearchChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Escribe para buscar un material..."
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-label="Buscar material del inventario"
        className={cn(
          "h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15",
          selectedProduct && "border-primary/40",
        )}
      />
      {open && (
        <div
          className="absolute inset-x-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-y-auto rounded-xl border bg-card p-1.5 shadow-xl"
          role="listbox"
        >
          {matches.length ? (
            matches.map((product) => (
              <button
                type="button"
                key={product.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(product);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {product.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {product.category} · {formatMoney(product.purchaseCost)}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-primary">
                  {product.quantity} uds.
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              {search
                ? "No encontramos materiales con ese nombre."
                : "Escribe el nombre o categoría para buscar."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SaleModal({
  business,
  onClose,
  onSaved,
}: {
  business: Business;
  onClose: () => void;
  onSaved: () => void;
}) {
  type MaterialLine = { productId: string; quantity: string; search: string };
  const products = useListProducts(
    { businessId: business.id },
    {
      query: {
        enabled: !!business.id,
        queryKey: getListProductsQueryKey({ businessId: business.id }),
      },
    },
  );
  const create = useCreateSale();
  const [error, setError] = useState("");
  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([
    { productId: "", quantity: "1", search: "" },
  ]);
  const [form, setForm] = useState({
    productName: "",
    laborHours: "0",
    saleDate: new Date().toISOString().slice(0, 10),
    description: "",
    photoUrl: "",
  });
  const update = (key: keyof typeof form, value: string) =>
    setForm((old) => ({ ...old, [key]: value }));
  const updateMaterial = (
    index: number,
    key: keyof MaterialLine,
    value: string,
  ) =>
    setMaterialLines((old) =>
      old.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [key]: value } : line,
      ),
    );
  const removeMaterial = (index: number) =>
    setMaterialLines((old) =>
      old.filter((_, lineIndex) => lineIndex !== index),
    );
  const selectedMaterials = materialLines
    .map((line) => ({
      line,
      product: products.data?.find(
        (item) => String(item.id) === line.productId,
      ),
      quantity: Number(line.quantity),
    }))
    .filter((item) => item.product && item.quantity > 0);
  const materialCost = selectedMaterials.reduce(
    (total, item) => total + item.product!.purchaseCost * item.quantity,
    0,
  );
  const operatingCost = materialCost * 0.1;
  const laborHours = Number(form.laborHours) || 0;
  const laborCost = laborHours * 5;
  const totalCost = materialCost + operatingCost + laborCost;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const validMaterials = materialLines.map((line) => ({
      productId: Number(line.productId),
      quantity: Number(line.quantity),
    }));
    if (!form.productName.trim()) {
      setError(
        "Escribe el nombre del producto o detalle que estás elaborando.",
      );
      return;
    }
    if (
      !validMaterials.length ||
      validMaterials.some(
        (material) => !material.productId || material.quantity < 1,
      )
    ) {
      setError(
        "Agrega al menos un material del inventario con una cantidad válida.",
      );
      return;
    }
    if (totalCost <= 0 || laborHours < 0) {
      setError("Revisa los materiales y las horas de trabajo.");
      return;
    }
    create.mutate(
      {
        data: {
          businessId: business.id,
          productId: null,
          productName: form.productName.trim(),
          quantity: 1,
          unitPrice: Number(totalCost.toFixed(2)),
          expenseAmount: Number(totalCost.toFixed(2)),
          laborHours,
          materials: validMaterials,
          saleDate: form.saleDate,
          description: form.description,
          photoUrl: form.photoUrl || null,
        },
      },
      {
        onSuccess: onSaved,
        onError: (requestError) =>
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No pudimos registrar la venta. Revisa el stock disponible.",
          ),
      },
    );
  };
  return (
    <Modal title="Registrar venta" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-secondary/45 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-card p-2 text-primary">
              <Calculator size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">Calcula tu precio de venta</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Añade los materiales usados y las horas de trabajo. El sistema
                suma automáticamente el 10% de gastos operativos.
              </p>
            </div>
          </div>
        </div>
        <Field
          label="¿Qué estás vendiendo?"
          value={form.productName}
          onChange={(v) => update("productName", v)}
          placeholder="Ej. Ramo personalizado para cumpleaños"
          testId="input-sale-name"
        />
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Materiales del inventario</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Escribe el nombre para encontrar un producto y cuánto
                utilizaste.
              </p>
            </div>
            <button
              type="button"
              data-testid="button-add-sale-material"
              onClick={() =>
                setMaterialLines((old) => [
                  ...old,
                  { productId: "", quantity: "1", search: "" },
                ])
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-primary hover:bg-secondary/70"
            >
              <Plus size={14} /> Añadir material
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {materialLines.map((line, index) => (
              <div key={index} className="flex gap-2">
                <MaterialAutocomplete
                  index={index}
                  value={line.search}
                  productId={line.productId}
                  products={products.data ?? []}
                  excludedProductIds={materialLines
                    .filter((_, otherIndex) => otherIndex !== index)
                    .map((otherLine) => otherLine.productId)
                    .filter(Boolean)}
                  onSearchChange={(value) =>
                    setMaterialLines((old) =>
                      old.map((current, lineIndex) =>
                        lineIndex === index
                          ? { ...current, search: value, productId: "" }
                          : current,
                      ),
                    )
                  }
                  onSelect={(product) =>
                    setMaterialLines((old) =>
                      old.map((current, lineIndex) =>
                        lineIndex === index
                          ? {
                              ...current,
                              search: product.name,
                              productId: String(product.id),
                            }
                          : current,
                      ),
                    )
                  }
                />
                <input
                  data-testid={`input-sale-material-quantity-${index}`}
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(event) =>
                    updateMaterial(index, "quantity", event.target.value)
                  }
                  aria-label="Cantidad de material"
                  className="h-11 w-20 rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  aria-label="Quitar material"
                  onClick={() => removeMaterial(index)}
                  disabled={materialLines.length === 1}
                  className="rounded-xl border px-3 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          {!products.isLoading && !products.data?.length && (
            <p className="mt-3 rounded-xl bg-[hsl(var(--accent)/.12)] p-3 text-xs text-[hsl(var(--accent))]">
              Primero agrega productos al inventario para poder calcular los
              materiales.
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Horas de trabajo"
            type="number"
            value={form.laborHours}
            onChange={(v) => update("laborHours", v)}
            placeholder="0"
            testId="input-sale-labor-hours"
          />
          <div className="flex items-end rounded-xl border bg-muted/50 px-3 py-2.5">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Tarifa de mano de obra
              </p>
              <p className="mt-1 flex items-center gap-2 font-mono text-sm font-bold">
                <Clock3 size={15} className="text-primary" /> $5.00 por hora
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
            Resumen del precio
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                Costo solo materiales
              </span>
              <span
                data-testid="text-sale-material-cost"
                className="font-mono font-semibold"
              >
                {formatMoney(materialCost)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                Gastos operativos (10%)
              </span>
              <span
                data-testid="text-sale-operating-cost"
                className="font-mono font-semibold"
              >
                {formatMoney(operatingCost)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                Mano de obra ({laborHours || 0} h × $5)
              </span>
              <span
                data-testid="text-sale-labor-cost"
                className="font-mono font-semibold"
              >
                {formatMoney(laborCost)}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-4 border-t pt-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Debes venderlo mínimo en
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Puedes subir este valor para agregar ganancia.
                </p>
              </div>
              <span
                data-testid="text-sale-suggested-price"
                className="font-mono text-2xl font-bold text-primary"
              >
                {formatMoney(totalCost)}
              </span>
            </div>
          </div>
        </div>
        <Field
          label="Fecha"
          type="date"
          value={form.saleDate}
          onChange={(v) => update("saleDate", v)}
          testId="input-sale-date"
        />
        <label className="block text-sm font-semibold">
          Descripción
          <textarea
            data-testid="input-sale-description"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Una nota breve sobre esta venta..."
            className="mt-2 min-h-20 w-full resize-y rounded-xl border bg-card p-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block text-sm font-semibold">
          <span className="flex items-center gap-2">
            Foto (opcional){" "}
            <Camera size={14} className="text-muted-foreground" />
          </span>
          <input
            data-testid="input-sale-photo"
            value={form.photoUrl}
            onChange={(event) => update("photoUrl", event.target.value)}
            placeholder="https://..."
            className="mt-2 h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        {error && (
          <p data-testid="text-sale-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button testId="button-cancel-sale" variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            testId="button-save-sale"
            type="submit"
            disabled={create.isPending || products.isLoading}
          >
            {create.isPending ? "Registrando..." : "Guardar venta"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ReportsPage({ business }: { business: Business }) {
  const [month, setMonth] = useState(currentMonth);
  const monthly = useGetMonthlyReport(
    { businessId: business.id, month },
    {
      query: {
        enabled: !!business.id,
        queryKey: getGetMonthlyReportQueryKey({
          businessId: business.id,
          month,
        }),
      },
    },
  );
  const weekly = useGetWeeklyReport(
    { businessId: business.id },
    {
      query: {
        enabled: !!business.id,
        queryKey: getGetWeeklyReportQueryKey({ businessId: business.id }),
      },
    },
  );
  const report = monthly.data;
  return (
    <>
      <PageHeader
        eyebrow="Reportes"
        title="Entender para avanzar"
        description="Una lectura tranquila de lo que pasó y lo que puedes ajustar."
        action={
          <label className="flex h-10 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-semibold">
            <CalendarDays size={16} className="text-primary" />
            <input
              data-testid="input-report-month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="bg-transparent outline-none"
            />
          </label>
        }
      />
      <QueryState
        loading={monthly.isLoading || weekly.isLoading}
        error={monthly.isError || weekly.isError}
        retry={() => {
          monthly.refetch();
          weekly.refetch();
        }}
      >
        {report && weekly.data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <ReportMetric label="Ventas" value={formatMoney(report.sales)} />
              <ReportMetric
                label="Gastos"
                value={formatMoney(report.expenses)}
              />
              <ReportMetric
                label="Utilidad neta"
                value={formatMoney(report.profit)}
                highlight
              />
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
              <Card className="p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                      Desglose mensual
                    </p>
                    <h2 className="mt-1 font-serif text-2xl capitalize">
                      {monthName.format(new Date(`${month}-15T12:00:00`))}
                    </h2>
                  </div>
                  <span className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-primary">
                    {report.saleCount} ventas
                  </span>
                </div>
                <div className="mt-8">
                  <ProductBars products={report.byProduct} />
                </div>
              </Card>
              <Card className="p-5 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                  Semana en curso
                </p>
                <h2 className="mt-1 font-serif text-2xl">
                  {weekly.data.hasSales
                    ? "El negocio se mueve"
                    : "Un espacio por llenar"}
                </h2>
                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="font-mono text-3xl font-bold">
                      {formatMoney(weekly.data.sales)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {weekly.data.saleCount} ventas registradas
                    </p>
                  </div>
                  <div className="rounded-xl bg-[hsl(var(--accent)/.15)] p-3 text-[hsl(var(--accent))]">
                    <TrendingUp size={22} />
                  </div>
                </div>
                <div className="mt-7 rounded-xl bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
                  Periodo: {date.format(new Date(weekly.data.startDate))} —{" "}
                  {date.format(new Date(weekly.data.endDate))}
                </div>
              </Card>
            </div>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                    Detalle de productos
                  </p>
                  <h2 className="mt-1 font-serif text-2xl">
                    Dónde se concentra el ingreso
                  </h2>
                </div>
                <FileBarChart2 size={19} className="text-muted-foreground" />
              </div>
              <div className="divide-y">
                {report.byProduct.map((item, index) => (
                  <div
                    data-testid={`row-report-product-${index}`}
                    key={`${item.label}-${index}`}
                    className="flex items-center gap-4 p-4 sm:p-5"
                  >
                    <span className="w-5 font-mono text-xs text-muted-foreground">
                      0{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <p className="truncate text-sm font-semibold">
                          {item.label}
                        </p>
                        <p className="font-mono text-sm">
                          {formatMoney(item.value)}
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${report.sales ? Math.min(100, (item.value / report.sales) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </QueryState>
    </>
  );
}
function ReportMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn("p-5", highlight && "border-primary/30 bg-secondary/45")}
    >
      <p className="text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-4 font-mono text-2xl font-bold",
          highlight && "text-primary",
        )}
      >
        {value}
      </p>
    </Card>
  );
}
function ProductBars({
  products,
}: {
  products: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...products.map((item) => item.value), 1);
  if (!products.length)
    return (
      <p className="rounded-xl bg-muted p-5 text-sm text-muted-foreground">
        Aún no hay productos para comparar este mes.
      </p>
    );
  return (
    <div className="space-y-5">
      {products.slice(0, 6).map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {formatMoney(item.value)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Box;
  title: string;
  body: string;
  action?: () => void;
}) {
  return (
    <div
      data-testid="empty-state"
      className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon size={25} />
      </div>
      <h2 className="mt-5 font-serif text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      {action && (
        <div className="mt-6">
          <Button testId="button-empty-action" onClick={action}>
            <Plus size={16} /> Comenzar
          </Button>
        </div>
      )}
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  testId: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        data-testid={testId}
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border bg-card px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#193a34]/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
    >
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">
              Control
            </p>
            <h2 className="mt-1 font-serif text-3xl">{title}</h2>
          </div>
          <button
            data-testid="button-close-modal"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default App;

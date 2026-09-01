import { useSyncExternalStore, useCallback } from "react";

// --- helpers localStorage ---
const getLS = (key: string) => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
};
const setLS = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new Event("ls-update"));
};
const subscribe = (cb: () => void) => {
  window.addEventListener("ls-update", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("ls-update", cb);
    window.removeEventListener("storage", cb);
  };
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

// Tipos
export type Business = { slug: string; name: string; [k:string]: any };
export type Product = { id: string; businessSlug: string; name: string; price: number; stock: number; [k:string]: any };
export type Sale = { id: string; businessSlug: string; productId: string; quantity: number; total: number; date: string; [k:string]: any };
export type OverviewReport = any;

// QueryKeys (para que React Query no crashee)
export const getGetDashboardSummaryQueryKey = () => ["dashboard"] as const;
export const getGetMonthlyReportQueryKey = () => ["monthly"] as const;
export const getGetWeeklyReportQueryKey = () => ["weekly"] as const;
export const getGetOverviewReportQueryKey = () => ["overview"] as const;
export const getListBusinessesQueryKey = () => ["businesses"] as const;
export const getListProductsQueryKey = () => ["products"] as const;
export const getListSalesQueryKey = () => ["sales"] as const;

// Hooks de lectura
export const useListBusinesses = () => {
  const data = useSyncExternalStore(subscribe, () => getLS("businesses"), () => []);
  return { data, isLoading: false };
};
export const useListProducts = () => {
  const data = useSyncExternalStore(subscribe, () => getLS("products"), () => []);
  return { data, isLoading: false };
};
export const useListSales = () => {
  const data = useSyncExternalStore(subscribe, () => getLS("sales"), () => []);
  return { data, isLoading: false };
};
export const useGetDashboardSummary = () => {
  const sales = useSyncExternalStore(subscribe, () => getLS("sales") as Sale[], () => []);
  const total = sales.reduce((s:number, x:Sale) => s + (x.total||0), 0);
  return { data: { totalSales: total, count: sales.length }, isLoading: false };
};
export const useGetMonthlyReport = () => ({ data: { sales: getLS("sales") }, isLoading: false });
export const useGetWeeklyReport = () => ({ data: { sales: getLS("sales") }, isLoading: false });
export const useGetOverviewReport = () => ({ data: { sales: getLS("sales") }, isLoading: false });

// Hooks de escritura
export const useCreateBusiness = () => {
  const mutate = useCallback((b: any) => {
    const list = getLS("businesses");
    const newB = { ...b, slug: b.slug || slugify(b.name || "negocio") + "-" + Date.now().toString().slice(-4) };
    setLS("businesses", [...list, newB]);
  }, []);
  return { mutate, mutateAsync: async (b:any) => mutate(b), isPending: false };
};
export const useCreateProduct = () => {
  const mutate = useCallback((p: any) => {
    const list = getLS("products");
    const newP = { ...p, id: p.id || Date.now().toString() };
    setLS("products", [...list, newP]);
  }, []);
  return { mutate, mutateAsync: async (p:any) => mutate(p), isPending: false };
};
export const useCreateSale = () => {
  const mutate = useCallback((s: any) => {
    const list = getLS("sales");
    const newS = { ...s, id: s.id || Date.now().toString(), date: s.date || new Date().toISOString() };
    setLS("sales", [...list, newS]);
    // descontar stock simple
    const prods = getLS("products") as Product[];
    setLS("products", prods.map(pr => pr.id === s.productId ? {...pr, stock: (pr.stock||0) - (s.quantity||1)} : pr));
  }, []);
  return { mutate, mutateAsync: async (s:any) => mutate(s), isPending: false };
};
export const useDeleteProduct = () => {
  const mutate = useCallback((id: string) => {
    setLS("products", getLS("products").filter((p:Product) => p.id !== id && p.id !== (id as any)?.id));
  }, []);
  return { mutate, mutateAsync: async (id:any) => mutate(id), isPending: false };
};
export const useDeleteSale = () => {
  const mutate = useCallback((id: string) => {
    setLS("sales", getLS("sales").filter((s:Sale) => s.id !== id && s.id !== (id as any)?.id));
  }, []);
  return { mutate, mutateAsync: async (id:any) => mutate(id), isPending: false };
};
export const useUpdateProduct = () => {
  const mutate = useCallback((p: any) => {
    const id = p.id || p?.data?.id;
    const data = p.data || p;
    setLS("products", getLS("products").map((pr:Product) => pr.id === id || pr.id === data.id ? {...pr, ...data} : pr));
  }, []);
  return { mutate, mutateAsync: async (p:any) => mutate(p), isPending: false };
};

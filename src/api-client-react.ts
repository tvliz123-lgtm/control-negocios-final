import { useState, useEffect, useCallback } from "react";

const getLS = (key: string) => {
  try {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch { return []; }
};
const setLS = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new Event("ls-update"));
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

export type Business = { slug: string; name: string; [k:string]: any };
export type Product = any;
export type Sale = any;
export type OverviewReport = any;

export const getGetDashboardSummaryQueryKey = () => ["dashboard"] as const;
export const getGetMonthlyReportQueryKey = () => ["monthly"] as const;
export const getGetWeeklyReportQueryKey = () => ["weekly"] as const;
export const getGetOverviewReportQueryKey = () => ["overview"] as const;
export const getListBusinessesQueryKey = () => ["businesses"] as const;
export const getListProductsQueryKey = () => ["products"] as const;
export const getListSalesQueryKey = () => ["sales"] as const;

function useLS(key: string) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    setData(getLS(key));
    const onUpdate = () => setData(getLS(key));
    window.addEventListener("ls-update", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("ls-update", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [key]);
  return data;
}

export const useListBusinesses = () => ({ data: useLS("businesses"), isLoading: false });
export const useListProducts = () => ({ data: useLS("products"), isLoading: false });
export const useListSales = () => ({ data: useLS("sales"), isLoading: false });
export const useGetDashboardSummary = () => {
  const sales = useLS("sales");
  const total = sales.reduce((s:number, x:any) => s + (x.total||0), 0);
  return { data: { totalSales: total, count: sales.length }, isLoading: false };
};
export const useGetMonthlyReport = () => ({ data: { sales: useLS("sales") }, isLoading: false });
export const useGetWeeklyReport = () => ({ data: { sales: useLS("sales") }, isLoading: false });
export const useGetOverviewReport = () => ({ data: { sales: useLS("sales") }, isLoading: false });

export const useCreateBusiness = () => {
  const mutate = useCallback((b: any) => {
    const list = getLS("businesses");
    const newB = {...b, slug: b.slug || slugify(b.name || "negocio") + "-" + Date.now().toString().slice(-4) };
    setLS("businesses", [...list, newB]);
  }, []);
  return { mutate, mutateAsync: async (b:any) => mutate(b), isPending: false };
};
export const useCreateProduct = () => {
  const mutate = useCallback((p: any) => {
    const list = getLS("products");
    setLS("products", [...list, {...p, id: p.id || Date.now().toString() }]);
  }, []);
  return { mutate, mutateAsync: async (p:any) => mutate(p), isPending: false };
};
export const useCreateSale = () => {
  const mutate = useCallback((s: any) => {
    const list = getLS("sales");
    setLS("sales", [...list, {...s, id: Date.now().toString(), date: new Date().toISOString() }]);
  }, []);
  return { mutate, mutateAsync: async (s:any) => mutate(s), isPending: false };
};
export const useDeleteProduct = () => {
  const mutate = useCallback((id: any) => {
    const realId = typeof id === "string"? id : id?.id;
    setLS("products", getLS("products").filter((p:any) => p.id!== realId));
  }, []);
  return { mutate, mutateAsync: async (id:any) => mutate(id), isPending: false };
};
export const useDeleteSale = () => {
  const mutate = useCallback((id: any) => {
    const realId = typeof id === "string"? id : id?.id;
    setLS("sales", getLS("sales").filter((s:any) => s.id!== realId));
  }, []);
  return { mutate, mutateAsync: async (id:any) => mutate(id), isPending: false };
};
export const useUpdateProduct = () => {
  const mutate = useCallback((p: any) => {
    const data = p.data || p;
    const id = data.id || p.id;
    setLS("products", getLS("products").map((pr:any) => pr.id === id? {...pr,...data} : pr));
  }, []);
  return { mutate, mutateAsync: async (p:any) => mutate(p), isPending: false };
};

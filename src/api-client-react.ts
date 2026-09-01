// mock para reemplazar @workspace/api-client-react en Vercel
export const getGetDashboardSummaryQueryKey = () => ["dashboard"] as const;
export const getGetMonthlyReportQueryKey = () => ["monthly"] as const;
export const getGetWeeklyReportQueryKey = () => ["weekly"] as const;
export const getGetOverviewReportQueryKey = () => ["overview"] as const;
export const getListBusinessesQueryKey = () => ["businesses"] as const;
export const getListProductsQueryKey = () => ["products"] as const;
export const getListSalesQueryKey = () => ["sales"] as const;

export const useCreateBusiness = () => ({ mutate: async () => {}, isPending: false });
export const useCreateProduct = () => ({ mutate: async () => {}, isPending: false });
export const useCreateSale = () => ({ mutate: async () => {}, isPending: false });
export const useDeleteProduct = () => ({ mutate: async () => {}, isPending: false });
export const useDeleteSale = () => ({ mutate: async () => {}, isPending: false });
export const useGetDashboardSummary = () => ({ data: undefined, isLoading: false });
export const useGetMonthlyReport = () => ({ data: undefined, isLoading: false });
export const useGetOverviewReport = () => ({ data: undefined, isLoading: false });
export const useGetWeeklyReport = () => ({ data: undefined, isLoading: false });
export const useListBusinesses = () => ({ data: [], isLoading: false });
export const useListProducts = () => ({ data: [], isLoading: false });
export const useListSales = () => ({ data: [], isLoading: false });
export const useUpdateProduct = () => ({ mutate: async () => {}, isPending: false });

export type Business = { slug: string; name?: string; [k: string]: any };
export type OverviewReport = any;
export type Product = any;
export type Sale = any;

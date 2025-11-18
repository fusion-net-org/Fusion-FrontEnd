// ---------- Aliases ----------
export type Guid = string;

// ---------- Wrappers ----------
export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

// ---------- Responses ----------
export type FeatureResponse = {
  id: Guid;
  code: string;
  name: string;
  category?: string | null;
  isActive: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type FeatureActiveResponse = {
  id: Guid;
  name: string;
};

// ---------- Requests ----------
export type FeatureCreateRequest = {
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isActive: boolean;
};

export type FeatureUpdateRequest = {
  id: Guid;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isActive: boolean;
};

export type FeatureCatalogPagedParams = {
  keyword?: string;
  isActive?: boolean | null;
  category?: string | null;
  // kế thừa PagedRequest ở BE => có sortColumn/sortDescending
  sortColumn?: "category" | "createdAt" | string; // BE map: { category, createdAt }
  sortDescending?: boolean;
  pageNumber: number;
  pageSize: number;
};
